import { SlashCommandBuilder } from "@discordjs/builders";
import type { CacheType, CommandInteraction } from "discord.js";
import fs from "fs-extra";
import path from "path";

import type { Command } from "../main";
import { scrape } from "../scrape";
import config from "../config/config.json";

interface BookJSON {
	url: string;
	trailingDot?: true;
}
let isBeingUsed = false;

export const command = {
	data: new SlashCommandBuilder()
		.setName("zad")
		.setDescription("Odpowiada ze screenem zadania")
		.addIntegerOption((option) =>
			option
				.setName("strona")
				.setDescription("Wpisz numer strony")
				.setRequired(true)
				.setMinValue(1)
		)
		.addStringOption((option) =>
			option.setName("zadanie").setDescription("Wpisz numer zadania").setRequired(true)
		),

	async execute(interaction: CommandInteraction<CacheType>) {
		if (isBeingUsed) {
			await interaction.reply("Bot jest już używany przez inną osobę!");
			return;
		}

		isBeingUsed = true;

		// Read values from command
		const book = config[interaction.channelId as keyof typeof config] as BookJSON;
		const page = interaction.options.get("strona")!.value as number;
		const exercise = interaction.options.get("zadanie")!.value as string;

		// Check user input
		if (!book) {
			await interaction.reply("Komenda nie jest dostępna w tym kanale!");
			isBeingUsed = false;
			return;
		}
		if (/[~!@$%^&*()+=,/';:"><[\]\\{}|`#]/gm.test(exercise)) {
			await interaction.reply("Błędny numer zadania!");
			isBeingUsed = false;
			return;
		}

		// Respond and animate message
		await interaction.deferReply();

		// Scrape and display
		const { screenshots, error } = await scrape(
			book.url,
			page,
			exercise,
			!!book.trailingDot,
			interaction,
			process.env.NODE_ENV === "server"
		);

		if (error) {
			await interaction.followUp(`\`\`\`diff\n-${error!.message}\`\`\``);
			isBeingUsed = false;
		} else {
			await interaction.followUp({ files: screenshots });
			if (screenshots!.length > 1)
				await interaction.followUp(
					"Wyświetlono wiele odpowiedzi, ponieważ na podanej stronie występuje więcej niż jedno zadanie z podanym numerem."
				);

			fs.emptyDirSync(path.join(process.cwd(), "screenshots"));
			isBeingUsed = false;
		}
	},
} as Command;
