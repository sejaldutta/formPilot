import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'FormPilot AI',
  version: '0.1.0',
  description:
    'Privacy-first assistant that explains Indian government forms and suggests values from your own documents. You review everything; you submit.',

  action: { default_title: 'Open FormPilot AI' },

  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },

  side_panel: { default_path: 'src/ui/sidepanel/index.html' },

  content_scripts: [
    {
      // Start narrow. Widen only as you add supported portals.
      matches: [
        'https://*.gov.in/*',
        'https://*.nic.in/*',
        'http://localhost/*',
        'http://127.0.0.1/*',
      ],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],

  permissions: ['sidePanel', 'activeTab', 'storage'],
});
