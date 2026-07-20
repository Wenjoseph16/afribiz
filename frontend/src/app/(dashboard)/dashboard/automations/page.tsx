'use client';

import { PageHeader } from '@/components/dashboard/PageHeader';
import { AutomationWorkflowBuilder } from '@/components/automation/AutomationWorkflowBuilder';

export default function AutomationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Automatisations"
        description="Créez des règles qui déclenchent des actions automatiquement pour gagner du temps"
        breadcrumbs={[{ label: 'Configuration' }, { label: 'Automatisations' }]}
      />

      <AutomationWorkflowBuilder />
    </div>
  );
}
