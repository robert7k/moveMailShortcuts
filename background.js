browser.commands.onCommand.addListener(onCommand);

/**
 * @param {string} command
 * @param {browser.tabs.Tab} tab
 */
async function onCommand(command, tab) {
	let folderIndex;
	if (command.startsWith("move_mail"))
		folderIndex = command.substring("move_mail_".length);
	else if (command.startsWith("goto_"))
		folderIndex = command.substring("goto_".length);
	else {
		console.log(`Received unknown command: ${command}`);
		return;
	}

	console.log(`Received command ${command}.`);
	const setting = await browser.storage.sync.get("folders").catch(console.error);
	if (!setting || !setting.folders || !setting.folders[folderIndex] || !setting.folders[folderIndex].value) {
		console.log("No folder setting found");
		return;
	}
	const folderSetting = setting.folders[folderIndex].value;
	const folderAction = setting.folders[folderIndex].action;
	console.log(`Got saved folder value: ${folderSetting}; action="${folderAction}"`);

	const folder = await findFolder(folderSetting);
	if (!folder) {
		console.log(`Folder ${setting.folder} not found`);
		return;
	}

	if (command.startsWith("move_mail"))
		handleMail(tab.id, folder, folderAction);
	else if (command.startsWith("goto_"))
		goto(tab.id, folder);
	else
		console.log("Unknown command:" + command);
}

/**
 * s
 * @param {number} tabId
 * @param {browser.folders.MailFolder} folder
 * @param {"move" | "copy" | "move_read"} folderAction
 */
async function handleMail(tabId, folder, folderAction) {
	const messages = await browser.messageDisplay.getDisplayedMessages(tabId);
    let messageIds;
	if (messages && messages.length > 0) {
		messageIds = messages.map(m => m.id);
	}

    if (!messageIds) {
        const msglist = await browser.mailTabs.getSelectedMessages(tabId);
        if (msglist && msglist.messages.length > 0) {
            messageIds = msglist.messages.map(m => m.id);
        }
    }

	if (messageIds) {
		console.log(`Message IDs: ${messageIds}; action: ${folderAction}; folder: ${folder.id}`);
		if (folderAction === "move_read") {
			await Promise.all(
				messageIds.map((id) => browser.messages.update(id, { read: true }))
			);
		}

		if (folderAction === "copy")
            // @ts-ignore
            await browser.messages.copy(messageIds, folder.id, {
                isUserAction: true
            });
        else
            // @ts-ignore
			await browser.messages.move(messageIds, folder.id, {
                isUserAction: true
            });
	} else {
        console.log("No messages selected");
    }
}

/**
 *
 * @param {number} tabId
 * @param {browser.folders.MailFolder} folder
 */
async function goto(tabId, folder) {
	await browser.mailTabs.update(tabId, {
		displayedFolder: folder
	});
}

/**
 *
 * @param {string} folderSetting
 * @returns {Promise<browser.folders.MailFolder | undefined>}
 */
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

/**
 *
 * @param {string} path
 * @param {browser.folders.MailFolder[] | undefined} list
 * @returns {browser.folders.MailFolder | undefined}
 */
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
