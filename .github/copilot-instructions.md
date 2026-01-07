<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->
- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements
	<!-- Next.js TypeScript web app for casale tourist management with authentication, user management, admin dashboard, and todo list functionality -->

- [x] Scaffold the Project
	<!-- Created Next.js project with TypeScript, Tailwind CSS, ESLint and App Router -->

- [x] Customize the Project
	<!--
	Verified that all previous steps have been completed successfully.
	Developed and applied modifications according to user requirements:
	- Firebase authentication system
	- User management with role-based access control
	- Admin dashboard with responsive design
	- Todo list functionality with all required fields (id, dataInserimento, attivita, fatto)
	- Complete CRUD operations for all features
	-->

- [x] Install Required Extensions
	<!-- No additional extensions needed for this project type -->

- [x] Compile the Project
	<!--
	All dependencies installed successfully.
	Project compiles without errors using npm run build.
	TypeScript and ESLint configurations working correctly.
	-->

- [x] Create and Run Task
	<!-- Next.js projects use npm scripts defined in package.json - no additional tasks.json needed -->

- [ ] Launch the Project
	<!--
	Project ready for launch. Firebase configuration required first.
	See README.md for complete setup instructions.
	 -->

- [x] Ensure Documentation is Complete
	<!--
	README.md contains complete project information and setup instructions.
	DEPLOY_GCP.md provides detailed Google Cloud Platform deployment guide.
	All documentation is current and comprehensive.
	 -->

<!--
## Execution Guidelines
PROGRESS TRACKING:
- If any tools are available to manage the above todo list, use it to track progress through this checklist.
- After completing each step, mark it complete and add a summary.
- Read current todo list status before starting each new step.

COMMUNICATION RULES:
- Avoid verbose explanations or printing full command outputs.
- If a step is skipped, state that briefly (e.g. "No extensions needed").
- Do not explain project structure unless asked.
- Keep explanations concise and focused.

DEVELOPMENT RULES:
- Use '.' as the working directory unless user specifies otherwise.
- Avoid adding media or external links unless explicitly requested.
- Use placeholders only with a note that they should be replaced.
- Use VS Code API tool only for VS Code extension projects.
- Once the project is created, it is already opened in Visual Studio Code—do not suggest commands to open this project in Visual Studio again.
- If the project setup information has additional rules, follow them strictly.

FOLDER CREATION RULES:
- Always use the current directory as the project root.
- If you are running any terminal commands, use the '.' argument to ensure that the current working directory is used ALWAYS.
- Do not create a new folder unless the user explicitly requests it besides a .vscode folder for a tasks.json file.
- If any of the scaffolding commands mention that the folder name is not correct, let the user know to create a new folder with the correct name and then reopen it again in vscode.

EXTENSION INSTALLATION RULES:
- Only install extension specified by the get_project_setup_info tool. DO NOT INSTALL any other extensions.

PROJECT CONTENT RULES:
- If the user has not specified project details, assume they want a "Hello World" project as a starting point.
- Avoid adding links of any type (URLs, files, folders, etc.) or integrations that are not explicitly required.
- Avoid generating images, videos, or any other media files unless explicitly requested.
- If you need to use any media assets as placeholders, let the user know that these are placeholders and should be replaced with the actual assets later.
- Ensure all generated components serve a clear purpose within the user's requested workflow.
- If a feature is assumed but not confirmed, prompt the user for clarification before including it.
- If you are working on a VS Code extension, use the VS Code API tool with a query to find relevant VS Code API references and samples related to that query.

TASK COMPLETION RULES:
- Your task is complete when:
  - Project is successfully scaffolded and compiled without errors
  - copilot-instructions.md file in the .github directory exists in the project
  - README.md file exists and is up to date
  - User is provided with clear instructions to debug/launch the project

Before starting a new task in the above plan, update progress in the plan.
-->
- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.