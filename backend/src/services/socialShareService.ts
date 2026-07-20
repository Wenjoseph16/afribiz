import { SocialPlatform } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import {
  publishSocialShareRequested,
  publishSocialShareSuccess,
  publishSocialShareFailed,
} from '../events/publishers';
import { logger } from '../lib/logger';
import { config } from '../config/env';

// ===================== ACCOUNT MANAGEMENT =====================

export async function connectAccount(
  businessId: string,
  data: {
    platform: SocialPlatform;
    accountName: string;
    accountId?: string;
    accessToken: string;
    tokenExpiresAt?: string;
    refreshToken?: string;
    avatar?: string;
    autoShare?: boolean;
    autoShareTypes?: string[];
  }
) {
  const account = await prisma.socialAccount.upsert({
    where: { businessId_platform: { businessId, platform: data.platform } },
    create: {
      businessId,
      platform: data.platform,
      accountName: data.accountName,
      accountId: data.accountId || null,
      accessToken: data.accessToken,
      tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : null,
      refreshToken: data.refreshToken || null,
      avatar: data.avatar || null,
      autoShare: data.autoShare ?? true,
      autoShareTypes: data.autoShareTypes || ['PRODUCT', 'SERVICE', 'PROMOTION', 'STORY', 'SHORT'],
    },
    update: {
      accountName: data.accountName,
      accountId: data.accountId || undefined,
      accessToken: data.accessToken,
      tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : undefined,
      refreshToken: data.refreshToken || undefined,
      avatar: data.avatar || undefined,
      autoShare: data.autoShare ?? undefined,
      autoShareTypes: data.autoShareTypes || undefined,
      isActive: true,
    },
  });
  return account;
}

export async function disconnectAccount(businessId: string, accountId: string) {
  const account = await prisma.socialAccount.findFirst({ where: { id: accountId, businessId } });
  if (!account) throw new AppError('Compte social non trouvé', 404);
  await prisma.socialAccount.update({
    where: { id: accountId },
    data: { isActive: false, autoShare: false },
  });
  return { message: 'Compte déconnecté' };
}

export async function listAccounts(businessId: string) {
  return prisma.socialAccount.findMany({ where: { businessId } });
}

export async function updateShareSettings(
  businessId: string,
  accountId: string,
  data: { autoShare?: boolean; autoShareTypes?: string[] }
) {
  const account = await prisma.socialAccount.findFirst({ where: { id: accountId, businessId } });
  if (!account) throw new AppError('Compte social non trouvé', 404);

  const updateData: any = {};
  if (data.autoShare !== undefined) updateData.autoShare = data.autoShare;
  if (data.autoShareTypes !== undefined) updateData.autoShareTypes = data.autoShareTypes;

  return prisma.socialAccount.update({ where: { id: accountId }, data: updateData });
}

// ===================== AUTO-SHARING =====================

type ShareContent = {
  type: 'PRODUCT' | 'SERVICE' | 'PROMOTION' | 'STORY' | 'SHORT';
  title: string;
  description?: string;
  imageUrl?: string;
  link: string;
  businessId: string;
  businessName: string;
  ownerId: string;
};

export async function autoShareToSocial(content: ShareContent) {
  const accounts = await prisma.socialAccount.findMany({
    where: { businessId: content.businessId, isActive: true, autoShare: true },
  });

  if (accounts.length === 0) return;

  for (const account of accounts) {
    if (!account.autoShareTypes.includes(content.type)) continue;

    const message = buildShareMessage(content, account.platform);
    publishSocialShareRequested({
      userId: content.ownerId,
      businessId: content.businessId,
      platform: account.platform,
      content: message,
    });

    try {
      await postToPlatform(account, message, content.imageUrl);
      publishSocialShareSuccess({
        userId: content.ownerId,
        businessId: content.businessId,
        platform: account.platform,
      });
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: { lastPostedAt: new Date() },
      });
    } catch (err: any) {
      logger.error(`Auto-share to ${account.platform} failed:`, err);
      publishSocialShareFailed({
        userId: content.ownerId,
        businessId: content.businessId,
        platform: account.platform,
        reason: err.message || 'Erreur inconnue',
      });
    }
  }
}

function buildShareMessage(content: ShareContent, platform: SocialPlatform): string {
  const prefix =
    platform === 'FACEBOOK' || platform === 'INSTAGRAM'
      ? `🆕 Nouveau contenu sur AfriBiz !`
      : `Nouveau sur AfriBiz :`;

  const label =
    content.type === 'PRODUCT'
      ? 'Produit'
      : content.type === 'SERVICE'
        ? 'Service'
        : content.type === 'PROMOTION'
          ? 'Promotion'
          : content.type === 'STORY'
            ? 'Story'
            : 'Short';

  let msg = `${prefix}\n\n${label} : ${content.title}`;
  if (content.description) {
    const desc =
      content.description.length > 200
        ? content.description.substring(0, 197) + '...'
        : content.description;
    msg += `\n${desc}`;
  }
  msg += `\n\n👉 ${content.businessName} — ${content.link}`;
  msg += `\n\n📱 Téléchargez AfriBiz pour découvrir plus !`;

  return msg;
}

async function postToPlatform(account: any, message: string, imageUrl?: string): Promise<void> {
  switch (account.platform) {
    case 'FACEBOOK':
      await postToFacebook(account, message, imageUrl);
      break;
    case 'TWITTER':
      await postToTwitter(account, message, imageUrl);
      break;
    case 'LINKEDIN':
      await postToLinkedIn(account, message, imageUrl);
      break;
    case 'INSTAGRAM':
      await postToInstagram(account, message, imageUrl);
      break;
    case 'TIKTOK':
      logger.info(`TikTok posting not yet implemented for ${account.accountName}`);
      break;
    default:
      throw new AppError(`Plateforme non supportée: ${account.platform}`, 500);
  }
}

// ===================== PLATFORM POSTERS =====================
// These functions require API tokens/keys configured in environment variables.
// By default they log the post attempt. Configure the actual APIs in production.

async function postToFacebook(account: any, message: string, imageUrl?: string): Promise<void> {
  const pageId = account.accountId;
  const accessToken = account.accessToken;
  if (!pageId || !accessToken) throw new AppError('Facebook: pageId ou accessToken manquant', 400);

  logger.info(`[Facebook] Posting to page ${pageId}: ${message.substring(0, 50)}...`);

  const apiVersion = config.FACEBOOK_API_VERSION || 'v21.0';
  const baseUrl = `https://graph.facebook.com/${apiVersion}/${pageId}`;

  if (imageUrl) {
    const photoRes = await fetch(`${baseUrl}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, url: imageUrl, access_token: accessToken }),
    });
    if (!photoRes.ok) {
      const err = await photoRes.json();
      throw new AppError(
        `Facebook API error: ${err.error?.message || photoRes.statusText}`,
        photoRes.status
      );
    }
  } else {
    const feedRes = await fetch(`${baseUrl}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: accessToken }),
    });
    if (!feedRes.ok) {
      const err = await feedRes.json();
      throw new AppError(
        `Facebook API error: ${err.error?.message || feedRes.statusText}`,
        feedRes.status
      );
    }
  }

  logger.info(`[Facebook] Post successful via Graph API`);
}

async function postToTwitter(account: any, message: string, _imageUrl?: string): Promise<void> {
  const accessToken = account.accessToken;
  if (!accessToken) throw new AppError('Twitter: accessToken manquant', 400);

  logger.info(`[Twitter] Posting: ${message.substring(0, 50)}...`);

  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: message }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new AppError(`Twitter API error: ${err.detail || res.statusText}`, res.status);
  }

  logger.info(`[Twitter] Post successful via API v2`);
}

async function postToLinkedIn(account: any, message: string, imageUrl?: string): Promise<void> {
  const accessToken = account.accessToken;
  const personId = account.accountId;
  if (!accessToken) throw new AppError('LinkedIn: accessToken manquant', 400);

  logger.info(`[LinkedIn] Posting: ${message.substring(0, 50)}...`);

  const body: any = {
    author: `urn:li:person:${personId || 'me'}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: message },
        shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };

  if (imageUrl) {
    body.specificContent['com.linkedin.ugc.ShareContent'].media = [
      {
        status: 'READY',
        description: { text: message.substring(0, 200) },
        media: imageUrl,
      },
    ];
  }

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new AppError(`LinkedIn API error: ${err.message || res.statusText}`, res.status);
  }

  logger.info(`[LinkedIn] Post successful via API`);
}

async function postToInstagram(account: any, message: string, imageUrl?: string): Promise<void> {
  const accessToken = account.accessToken;
  if (!accessToken) throw new AppError('Instagram: accessToken manquant', 400);
  if (!imageUrl) throw new AppError('Instagram: imageUrl requis pour les posts', 400);

  logger.info(`[Instagram] Posting image: ${imageUrl.substring(0, 50)}...`);

  const apiVersion = config.FACEBOOK_API_VERSION || 'v21.0';
  const igUserId = account.accountId;
  if (!igUserId) throw new AppError('Instagram: compte non lié (accountId requis)', 400);

  // Step 1: Create media container
  const createRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: message.substring(0, 2200),
      access_token: accessToken,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new AppError(
      `Instagram API error (create): ${err.error?.message || createRes.statusText}`,
      createRes.status
    );
  }

  const { id: containerId } = (await createRes.json()) as { id: string };

  // Step 2: Publish the container
  const publishRes = await fetch(
    `https://graph.facebook.com/${apiVersion}/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
    }
  );

  if (!publishRes.ok) {
    const err = await publishRes.json();
    throw new AppError(
      `Instagram API error (publish): ${err.error?.message || publishRes.statusText}`,
      publishRes.status
    );
  }

  logger.info(`[Instagram] Post successful via Graph API`);
}
