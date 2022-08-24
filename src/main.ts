import { SlashCommandBuilder } from "@discordjs/builders";
import { CacheType, Client, Collection, CommandInteraction } from "discord.js";
import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
import clc from "cli-color";

export type Command = {
	data: SlashCommandBuilder,
	execute: (interaction: CommandInteraction<CacheType>) => Promise<void>
}

(async () => {
	dotenv.config();

	// Setup bot
	const client = new Client({ intents: "Guilds" });
	client.once("ready", () => console.log(clc.green("ready")));

	// Retrieve commands
	const commands = new Collection<string, Command>();
	const files = fs.readdirSync(path.resolve(__dirname, "./commands")).filter(file => file.endsWith(".ts"));
	for (const file of files) {
		const command = await import(`./commands/${file}`) as Command;
		commands.set(command.data.name, command);
	}

	// Execute commands
	client.on("interactionCreate", async interaction => {
		if (!interaction.isCommand())
			return;

		const command = commands.get(interaction.commandName);

		if (!command)
			return;

		try {
			await command.execute(interaction);
		} catch (error: any) {
			await interaction.channel?.send({ content: "Błąd (main.ts):\n\n" + error.message });
		}
	});

	await client.login(process.env.TOKEN);
})();