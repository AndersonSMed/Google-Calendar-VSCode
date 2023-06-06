import * as vscode from "vscode";
import { google } from "googleapis";
import { OAuth2Client, subscribeToCalendar } from "./calendar";

export class GoogleCalendarProvider
  implements vscode.TreeDataProvider<CalendarEvent>
{
  private calendarInstance: ReturnType<typeof google.calendar> | undefined;

  constructor(private workspaceRoot: string) {
    this.listenForEvents = this.listenForEvents.bind(this);
    subscribeToCalendar(this.listenForEvents);
  }

  private async listenForEvents(auth: OAuth2Client) {
    if (!this.calendarInstance) {
      this.calendarInstance = google.calendar({ version: "v3", auth });
    }

    const response = await this.calendarInstance.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items;

    if (!events || events.length === 0) {
      return;
    }

    events.map((event) => {
      const start = event.start?.dateTime || event.start?.date;
      console.log(`${start} - ${event.summary}`);
    });
  }

  getTreeItem(element: CalendarEvent): vscode.TreeItem {
    return element;
  }

  getChildren(element?: CalendarEvent): Thenable<CalendarEvent[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage(
        "No CalendarEvent in empty workspace"
      );
      return Promise.resolve([]);
    }

    return Promise.resolve([]);
  }
}

class CalendarEvent extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
  }
}

const rootPath =
  vscode.workspace.workspaceFolders &&
  vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;

vscode.window.createTreeView("google-calendar-view", {
  treeDataProvider: new GoogleCalendarProvider(`${rootPath}`),
});
