import process from "node:process";
import App from "./Utils/Classes/App.ts";

const application = new App();

try {
	await application.Init();
} catch (error) {
	application.Logger.fatal("A fatal error occurred before the server could start.");
	application.Logger.fatal(error);

	process.exit(1);
}
