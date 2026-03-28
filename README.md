# TemplateEditor

Browser-based editor for Windows optimization template. Load, edit, validate, and export XML templates that drive registry, service, scheduled task, app removal, PowerShell, and file/folder actions across multiple Windows OS versions. No install, no backend — runs entirely in your browser.

**Live app:** https://j81blog.github.io/TemplateEditor/

---

## What is a template?

A template is an XML file that describes a set of configuration actions to apply to a Windows machine. Each item in the template defines:

- **What** to do (type + payload)
- **Where** it applies (which OS versions, physical/virtual/execute flags)
- **How** it is organized (category, order, description)

The editor lets you create and maintain these templates visually, without touching XML directly.

---

## Getting started

Open the app at the link above. On first load it automatically opens the built-in `Windows.xml` default template so you can explore a real example right away.

To start from scratch, click **New from Default** in the toolbar — this resets to the default template.
To open your own file, click **Open…** and select a `.xml` template from your computer.

---

## Interface overview

```
┌──────────────────────────────────────────────────────────┐
│  Toolbar                                                  │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│  Sidebar     │  Item editor                              │
│  (item list) │                                           │
│              │                                           │
└──────────────┴───────────────────────────────────────────┘
```

### Toolbar buttons

| Button               | Action                                                                               |
| -------------------- | ------------------------------------------------------------------------------------ |
| **New from Default** | Reset to the built-in default template                                               |
| **Open…**            | Load a `.xml` template file from disk, edit your own template                        |
| **Download XML**     | Save the current template as an XML file (disabled when there are validation errors) |
| **Manage OS**        | Add, edit, or remove OS definitions                                                  |
| **PDF Report**       | Export a formatted PDF overview of all items                                         |
| **☾ / ☀**           | Toggle dark/light theme (remembers your preference)                                  |

The toolbar also shows the current filename and a yellow **Modified** indicator when there are unsaved changes.

### Sidebar

Lists all items in the template. You can:

- **Search** by name, description, or category using the search box
- **Filter** by category, type, or OS using the dropdowns
- **Sort** by category grouping or numeric order
- **Add a new item** with the `+` button at the top
- **Select an item** to open it in the editor

Each item row shows its type icon, name, category, and which OS versions it is mapped to.

### Item editor

Editing area for the selected item, split into two columns:

- **Left column** — General fields (name, description, type, category, order) and the type-specific payload
- **Right column** — OS Mapping table

Changes are applied immediately; the Modified indicator appears in the toolbar.

---

## Item types and their fields

### Registry

Reads or writes a Windows registry value.

| Field         | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| Hive          | `HKLM`, `HKCU`, `HKU`, or `HKU\DefaultUser`                         |
| Path          | Registry key path (without the hive)                                |
| Name          | Value name; leave empty for the default value                       |
| Action        | `SetValue`, `DeleteKey`, `DeleteKeyRecursively`, `DeleteValue`      |
| Value         | Data to write (for SetValue)                                        |
| Registry Type | `String`, `ExpandString`, `Binary`, `DWord`, `MultiString`, `Qword` |

### Service

Controls a Windows service.

| Field  | Description                       |
| ------ | --------------------------------- |
| Name   | Service name                      |
| Action | `Disabled`, `Automatic`, `Manual` |

### Scheduled Task

Enables or disables a scheduled task.

| Field  | Description                                      |
| ------ | ------------------------------------------------ |
| Name   | Task name                                        |
| Path   | Task folder path (e.g. `\Microsoft\Windows\...`) |
| Action | `Enabled`, `Disabled`                            |

### Store App

Removes a Windows Store / AppX package.

| Field | Description                         |
| ----- | ----------------------------------- |
| Name  | Package family name or display name |

### PowerShell

Runs a PowerShell script.

| Field  | Description                                                 |
| ------ | ----------------------------------------------------------- |
| Engine | `powershell` (Windows PowerShell) or `pwsh` (PowerShell 7+) |
| Script | The script content                                          |

### FileFolder

Performs a file or folder operation.

| Field     | Description                      |
| --------- | -------------------------------- |
| Path      | Full path to the file or folder  |
| Action    | `Delete`, `Rename`, `Remove`     |
| Item Type | `File` or `Folder`               |
| New Name  | Required when Action is `Rename` |

---

## OS Mapping

Each item has an OS mapping that controls on which operating systems the action runs and in what context.

The OS Mapping table shows a row per configured OS. Three checkboxes per OS control the behavior:

| Column       | Meaning                                          |
| ------------ | ------------------------------------------------ |
| **Execute**  | Whether the action is executed at all on this OS |
| **Physical** | Applies when running on physical hardware        |
| **Virtual**  | Applies when running in a virtual machine        |

An OS that is not listed in an item's mapping means the action does not apply to that OS. You can add or remove OS entries per item using the `+` / `−` controls in the mapping table.

> **Rule:** if both Physical and Virtual are unchecked, Execute is automatically forced off.

---

## Managing OS definitions

Click **Manage OS** to open the OS definitions dialog. This is the global list of operating systems the template supports.

Each OS definition has:

| Field           | Description                                                                         |
| --------------- | ----------------------------------------------------------------------------------- |
| Tag             | Unique XML element name used internally (e.g. `Windows11`)                          |
| Name            | Display name (e.g. `Windows 11`)                                                    |
| Abbreviation    | Short label shown in the OS mapping table; auto-derived from the name if left empty |
| Server OS       | Whether this is a Windows Server edition                                            |
| BuildStartsWith | One or more Windows build number prefixes used to identify this OS at runtime       |

Deleting an OS that is referenced by items will show a confirmation prompt.

---

## Validation

The toolbar's **Download XML** button is disabled when the document has errors. A validation bar at the bottom of the editor shows all current errors and warnings with their location.

Common validation rules:

- Name and type are required on every item
- Registry items must have a hive and path
- ScheduledTask items must have a name and path
- PowerShell items must have a non-empty script
- FileFolder Rename action requires a new name
- OS mapping: Execute cannot be true if both Physical and Virtual are false

---

## PDF export

Click **PDF Report** to export a formatted document listing all items.

Options:

- **OS Filter** — restrict the report to items mapped to a specific OS (or leave as "All OS")
- **Sort By** — order items by their numeric `Order` field or alphabetically by name

The PDF is generated entirely in the browser and downloaded automatically.

---

## XML format

The template XML follows a structured format. Below is a minimal example:

```xml
<WindowsOptimizationTemplate>
  <SupportedOS>
    <Windows11 Name="Windows 11" Abbreviation="W11" IsServerOS="false">
      <BuildStartsWith>226</BuildStartsWith>
    </Windows11>
  </SupportedOS>
  <Registry Name="Disable Telemetry" Description="..." Category="Privacy" Order="100">
    <Hive>HKLM</Hive>
    <Path>SOFTWARE\Policies\Microsoft\Windows\DataCollection</Path>
    <Name>AllowTelemetry</Name>
    <Action>SetValue</Action>
    <Value>0</Value>
    <RegistryType>DWord</RegistryType>
    <Windows11 Execute="true" Physical="true" Virtual="true" />
  </Registry>
</WindowsOptimizationTemplate>
```

---

## Development

```bash
npm install
npm run dev      # start dev server
npm run build    # production build → dist/
npm run test     # run unit tests
```

Built with [Vue 3](https://vuejs.org/), [Vite](https://vitejs.dev/), and [TypeScript](https://www.typescriptlang.org/). No external UI framework.

Deployed automatically to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.