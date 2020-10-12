// Fix for  https://bugzilla.mozilla.org/show_bug.cgi?id=1607859
window.browser = window.browser.extension.getBackgroundPage().browser;

const settingsForm = document.querySelector("#settings-form");

function saveOptions(e) {
  e.preventDefault();
  const values = Array.from(document.querySelectorAll("#settings-form select").values())
	.map(select => { return { "id": select.id, "value": select.value }; } );
  browser.storage.sync.set({ folders: values });
}

function restoreOptions(idx, folderSelect) {
  function loadFolders(account, folderList, parent, prefix = "") {
	if (!folderList)
		return;
	folderList.forEach(folder => {
		const f = document.createElement("option");
		f.appendChild(document.createTextNode(prefix + folder.name));
		const valueAttr = document.createAttribute("value");
		valueAttr.value = JSON.stringify({ folderPath: folder.path, accountId: account.id });
		f.setAttributeNode(valueAttr);
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
		
		const option = document.createElement("option");
		option.appendChild(document.createTextNode("None"));
		option.setAttributeNode(document.createAttribute("value"));
		select.appendChild(option);
		p.appendChild(select);
		
		restoreOptions(i, select);
		
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
