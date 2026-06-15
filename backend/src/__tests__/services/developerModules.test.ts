/**
 * Developer Services unit tests
 */

import { mockPrisma } from "../setup";
import * as permissionsService from "../../services/developerPermissions";
import * as licensesService from "../../services/developerLicenses";
import * as apiService from "../../services/developerApi";
import * as validationService from "../../services/developerValidation";
import * as configService from "../../services/developerConfiguration";
import * as activityService from "../../services/developerActivityLog";
import { AppError } from "../../middlewares/errorHandler";

jest.mock("../../repositories/developerRepository", () => ({
  DeveloperRepository: {
    findByUserId: jest.fn().mockResolvedValue({ id: "dev-1", userId: "user-1" }),
  },
}));

describe("Developer Services", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("PermissionsService", () => {
    it("should add a permission", async () => {
      (mockPrisma.developerModule.findFirst as jest.Mock).mockResolvedValue({
        id: "module-1", developerId: "dev-1",
      });
      (mockPrisma.modulePermission.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.modulePermission.create as jest.Mock).mockResolvedValue({ id: "perm-1" });

      const result = await permissionsService.addModulePermission("user-1", "module-1", {
        resource: "PRODUCTS", accessLevel: "READ",
      });
      expect(result).toHaveProperty("id");
    });

    it("should reject duplicate", async () => {
      (mockPrisma.developerModule.findFirst as jest.Mock).mockResolvedValue({
        id: "module-1", developerId: "dev-1",
      });
      (mockPrisma.modulePermission.findUnique as jest.Mock).mockResolvedValue({ id: "existing" });

      await expect(
        permissionsService.addModulePermission("user-1", "module-1", { resource: "PRODUCTS", accessLevel: "READ" })
      ).rejects.toThrow(AppError);
    });
  });

  describe("LicensesService", () => {
    it("should create a license", async () => {
      (mockPrisma.moduleLicense.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.moduleLicense.create as jest.Mock).mockResolvedValue({
        id: "lic-1", licenseKey: "TEST-KEY", status: "PENDING",
      });

      const result = await licensesService.createLicense("module-1", "biz-1", { licenseType: "STANDARD" });
      expect(result).toHaveProperty("licenseKey");
    });

    it("should reject duplicate", async () => {
      (mockPrisma.moduleLicense.findFirst as jest.Mock).mockResolvedValue({ id: "existing", status: "ACTIVE" });
      await expect(
        licensesService.createLicense("module-1", "biz-1", { licenseType: "STANDARD" })
      ).rejects.toThrow(AppError);
    });
  });

  describe("ApiService", () => {
    it("should create an API key", async () => {
      (mockPrisma.developerApiKey.create as jest.Mock).mockResolvedValue({
        id: "key-1", name: "Test", key: "key...", isActive: true,
      });
      const result = await apiService.createApiKey("user-1", { name: "Test" });
      expect(result).toHaveProperty("key");
    });
  });

  describe("ValidationService", () => {
    it("should submit for validation", async () => {
      (mockPrisma.developerModule.findFirst as jest.Mock).mockResolvedValue({
        id: "module-1", developerId: "dev-1",
      });
      (mockPrisma.developerModuleVersion.findFirst as jest.Mock).mockResolvedValue({ id: "ver-1" });
      (mockPrisma.moduleValidation.create as jest.Mock).mockResolvedValue({
        id: "val-1", status: "PENDING", checks: [],
      });
      (mockPrisma.developerModule.update as jest.Mock).mockResolvedValue({});

      const result = await validationService.submitForValidation("user-1", "module-1");
      expect(result.status).toBe("PENDING");
    });
  });

  describe("ConfigurationService", () => {
    it("should save configuration", async () => {
      (mockPrisma.moduleConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.moduleConfiguration.create as jest.Mock).mockResolvedValue({ id: "cfg-1", settings: {} });

      const result = await configService.saveModuleConfiguration("module-1", "biz-1", "inst-1", {});
      expect(result).toHaveProperty("id");
    });
  });

  describe("ActivityLogService", () => {
    it("should log activity", async () => {
      (mockPrisma.moduleActivityLog.create as jest.Mock).mockResolvedValue({
        id: "act-1", activityType: "MODULE_INSTALLED",
      });

      const result = await activityService.logActivity("user-1", "module-1", "MODULE_INSTALLED", {});
      expect(result).toHaveProperty("id");
    });

    it("should return stats", async () => {
      (mockPrisma.moduleActivityLog.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.moduleActivityLog.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.moduleActivityLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await activityService.getActivityStats("module-1");
      expect(result.total).toBe(10);
    });
  });
});
