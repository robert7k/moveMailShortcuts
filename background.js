browser.commands.onCommand.addListener(onCommand);

async function onCommand(command) {
	if (command !== "moveMail") 
		return;
	console.log("Received command to move mail.");
	const setting = await browser.storage.sync.get("folder").catch(console.error);
	if (!setting || !setting.folder) {
		console.err("No folder setting found");
		return;
	}
	console.log("Got saved folder value: " + setting.folder);

	const tabs = await browser.tabs.query({
		active: true,
		currentWindow: true,
	});
	let tabId = tabs[0].id;
	const message = await browser.messageDisplay.getDisplayedMessage(tabId);
	if (!message) {
		console.log("No message selected");
		return;
	}
	const folder = await findFolder(setting.folder);
	if (!folder) {
		console.log(`Folder ${setting.folder} not found`);
		return;
	}
	await browser.messages.move([message.id], folder);
}

async function findFolder(path) {
	const accounts = await browser.accounts.list();
	return findSubfolder(path, accounts.flatMap(account => account.folders));
}

function findSubfolder(path, list) {
	if (!list)
		return undefined;
	let result = list.find(f => f.path === path);
	if (result)
		return result;
	for (i = 0; i < list.length; i++) {
		result = findSubfolder(path, list[i].subFolders);
		if (result)
			return result;
	}
	return undefined;
}
