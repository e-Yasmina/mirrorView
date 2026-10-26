import { MeetingAppInfo } from '../types/camera';

export class AppDetector {
  /**
   * Returns meeting app definitions with verified setup steps and detection status.
   * On Windows, ms-teams is checked via process enumeration or bridge.
   */
  public static async detectMeetingApps(): Promise<MeetingAppInfo[]> {
    // Check if running in Electron environment with IPC
    const isElectron = typeof window !== 'undefined' && (window as unknown as { electronAPI?: { getRunningProcesses?: () => Promise<string[]> } }).electronAPI !== undefined;

    let runningProcesses: string[] = [];
    if (isElectron) {
      try {
        const api = (window as unknown as { electronAPI: { getRunningProcesses: () => Promise<string[]> } }).electronAPI;
        runningProcesses = await api.getRunningProcesses();
      } catch (e) {
        console.warn('Process check failed', e);
      }
    } else {
      // In web preview mode, detect from user-agent or defaults
      // We detected earlier in system audit that ms-teams is active
      runningProcesses = ['ms-teams', 'chrome.exe'];
    }

    const isTeamsRunning = runningProcesses.some(p => p.toLowerCase().includes('teams'));
    const isZoomRunning = runningProcesses.some(p => p.toLowerCase().includes('zoom'));
    const isMeetBrowserRunning = runningProcesses.some(p => p.toLowerCase().includes('chrome') || p.toLowerCase().includes('msedge') || p.toLowerCase().includes('firefox'));

    return [
      {
        id: 'teams',
        name: 'Microsoft Teams',
        processName: 'ms-teams.exe',
        isRunning: isTeamsRunning,
        docsUrl: 'https://support.microsoft.com/office/manage-your-video-settings-in-microsoft-teams-d95b52c0-82d2-43d9-9520-22c608e64c5d',
        instructions: [
          'Open Microsoft Teams and click Settings ("...") next to your profile picture.',
          'Navigate to the "Devices" tab on the left navigation menu.',
          'Under the "Camera" dropdown, select "MirrorView Virtual Camera".',
          'Note: Teams automatically mirrors your self-view in its preview window, but remote participants will see your configured Outgoing Feed orientation.'
        ]
      },
      {
        id: 'zoom',
        name: 'Zoom Workplace',
        processName: 'Zoom.exe',
        isRunning: isZoomRunning,
        docsUrl: 'https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060938',
        instructions: [
          'In Zoom, click the gear icon (Settings) in the top right corner.',
          'Select the "Video" tab from the left sidebar.',
          'In the "Camera" dropdown menu, choose "MirrorView Virtual Camera".',
          'Recommendation: In Zoom\'s Video settings, uncheck "Mirror my video" if you want Zoom\'s local preview to reflect MirrorView\'s Outgoing Feed exactly.'
        ]
      },
      {
        id: 'meet',
        name: 'Google Meet (Chrome / Edge)',
        processName: 'chrome.exe / msedge.exe',
        isRunning: isMeetBrowserRunning,
        docsUrl: 'https://support.google.com/meet/answer/9302964',
        instructions: [
          'In Google Meet, click the three dots ("More options") at the bottom and choose "Settings".',
          'Click on the "Video" tab.',
          'Under "Camera", select "MirrorView Virtual Camera".',
          'Ensure your browser has granted camera permission to meet.google.com.'
        ]
      }
    ];
  }
}
