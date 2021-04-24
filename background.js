browser.commands.onCommand.addListener(onCommand);

async function onCommand(command) {
	const folderIndex = command.substring("move_mail_".length);
	console.log(`Received command to move mail to folder ${folderIndex}.`);
	const setting = await browser.storage.sync.get("folders").catch(console.error);
	if (!setting || !setting.folders || !setting.folders[folderIndex] || !setting.folders[folderIndex].value) {
		console.log("No folder setting found");
		return;
	}
	const folderSetting = setting.folders[folderIndex].value;
	console.log(`Got saved folder value: ${folderSetting}`);

	const tabs = await browser.tabs.query({
		active: true,
		currentWindow: true,
	});
	let tabId = tabs[0].id;
	const messages = await browser.messageDisplay.getDisplayedMessages(tabId);
	if (!messages) {
		console.log("No messages selected");
		return;
	}
	const folder = await findFolder(folderSetting);
	if (!folder) {
		console.log(`Folder ${setting.folder} not found`);
		return;
	}
	const messageIds = messages.map(m => m.id);
	console.log(`Message IDs: ${messageIds}`);
	await browser.messages.move(messageIds, folder);
}

async function findFolder(folderSetting) {
	try {
		const setting = JSON.parse(folderSetting);
		if (setting.accountId) {
			const account = await browser.accounts.get(setting.accountId);
			return findSubfolder(setting.folderPath, account.folders);
		}
	} catch (ex) {
		// Saved with previous version which only contains the folder name
		const accounts = await browser.accounts.list();
		return findSubfolder(folderSetting, accounts.flatMap(account => account.folders));
	}
}

function findSubfolder(path, list) {
	if (!list)
		return undefined;
	let result = list.find(f => f.path === path);
	if (result)
		return result;
	for (let i = 0; i < list.length; i++) {
		result = findSubfolder(path, list[i].subFolders);
		if (result)
			return result;
	}
	return undefined;
}
