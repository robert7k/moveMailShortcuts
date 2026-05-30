// Fix for  https://bugzilla.mozilla.org/show_bug.cgi?id=1607859
window.browser = window.browser.extension.getBackgroundPage().browser;

const settingsForm = document.querySelector("#settings-form");

function saveOptions(e) {
  e.preventDefault();
  const values = Array.from(document.querySelectorAll("#settings-form p").values())
	  .map(p => {
		  const folderSelect = p.querySelector("select");
		  const actionSelect = p.querySelector("select.action");
		  return {
			  "id": folderSelect.id,
			  "value": folderSelect.value,
			  "action": actionSelect.value
		  };
	  });
  browser.storage.sync.set({ folders: values });
}

function restoreOptions(idx, folderSelect, actionSelect) {
  function loadFolders(account, folderList, parent, prefix = "") {
	if (!folderList)
		return;
	  folderList.forEach(folder => {
		const f = createOption(prefix + folder.name, JSON.stringify({ folderPath: folder.path, accountId: account.id }));
		loadFolders(account, folder.subFolders, parent, prefix + "\xa0");
		parent.appendChild(f);
	});
  }
  function loadAccounts(accounts) {
	  accounts.forEach((account) => {
		const a = document.createElement("optgroup");
		var attr = document.createAttribute("label");
		attr.value = account.name;
		a.setAttributeNode(attr);
		loadFolders(account, account.folders, a);
		folderSelect.appendChild(a);
	  });
  }

  browser.accounts.list().then(loadAccounts);
  browser.storage.sync.get("folders")
	.then(v => {
		if (v.folders[idx]) {
			console.log(v.folders[idx]);
			folderSelect.value = v.folders[idx].value;
			actionSelect.value = v.folders[idx].action || "move";
		}
	} );
}

function fillForm() {
	for(let i = 0; i < 10; i++) {
		const p = document.createElement("p");
		const label = document.createElement("label");
		label.appendChild(document.createTextNode(`Folder ${i + 1}: `));
		const labelAttr = document.createAttribute("for");
		labelAttr.value = `folder${i}`;
		label.setAttributeNode(labelAttr);
		p.appendChild(label);

		const select = document.createElement("select");
		const selectId = document.createAttribute("id");
		selectId.value = labelAttr.value;
		select.setAttributeNode(selectId);

		const option = createOption("None");
		select.appendChild(option);
		p.appendChild(select);

		const actionSelect = createActionSelect(labelAttr.value);
		p.append(actionSelect);

		restoreOptions(i, select, actionSelect);

		settingsForm.appendChild(p);
	}
	const button = document.createElement("button");
	const buttonAttr = document.createAttribute("type");
	buttonAttr.value = "submit";
	button.setAttributeNode(buttonAttr);
	button.appendChild(document.createTextNode("Save"));
	settingsForm.appendChild(button);
}

document.addEventListener("DOMContentLoaded", fillForm);
document.querySelector("form").addEventListener("submit", saveOptions);

/**
 *
 * @param {string} folderId
 * @returns {HTMLSelectElement}
 */
function createActionSelect(folderId) {
	const actionSelect = document.createElement("select");
	const actionSelectClass = document.createAttribute("class");
	actionSelectClass.value = "action";
	actionSelect.setAttributeNode(actionSelectClass);
	const actionSelectId = document.createAttribute("id");
	actionSelectId.value = `action_${folderId}`;
	actionSelect.setAttributeNode(actionSelectId);

	actionSelect.appendChild(createOption("Move", "move"));
	actionSelect.appendChild(createOption("Move and mark as read", "move_read"));
	actionSelect.appendChild(createOption("Copy", "copy"));
	return actionSelect;
}

/**
 * @param {string} label
 * @param {string | undefined} value
 * @returns {HTMLOptionElement}
 */
function createOption(label, value) {
	const option = document.createElement("option");
	option.appendChild(document.createTextNode(label));
	const valueAttr = document.createAttribute("value");
	if (value !== undefined) {
		valueAttr.value = value;
	}
	option.setAttributeNode(valueAttr);
	return option;
}
