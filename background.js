browser.commands.onCommand.addListener(function (command) {
	if (command !== "moveMail") 
		return;
	console.log("Moving Mail");
	browser.storage.sync.get("folder").then(setting => {
		console.log("Got saved folder value: " + setting.folder);
		browser.tabs.query({
			active: true,
			currentWindow: true,
		}).then(tabs => {
			let tabId = tabs[0].id;
			browser.messageDisplay.getDisplayedMessage(tabId).then((message) => {
				findFolder(setting.folder).then(folder => {
					if (!folder)
						console.log(`Folder ${setting.folder} not found`);
					else
						browser.messages.move([message.id], folder);
				});
			});
		});
	});
});

function findFolder(path) {
	return browser.accounts.list().then(accounts => {
		return findSubfolder(path, accounts.flatMap(account => account.folders));
	});
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
