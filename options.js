// Fix for  https://bugzilla.mozilla.org/show_bug.cgi?id=1607859
window.browser = window.browser.extension.getBackgroundPage().browser;

const accountList = document.querySelector("#folder-selector");

function saveOptions(e) {
  e.preventDefault();
  console.log("save");
  browser.storage.sync.set({
	folder: accountList.value
  });
}

function restoreOptions() {
  function setCurrentChoice(result) {
	  console.log("Got saved folder value: " + result.folder);
	  accountList.value = result.folder;
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }
  function loadFolders(folderList, parent, prefix = "") {
	if (!folderList)
		return;
	folderList.forEach(folder => {
		const f = document.createElement("option");
		f.appendChild(document.createTextNode(prefix + folder.name));
		var attr = document.createAttribute("value");
		attr.value = folder.path;
		f.setAttributeNode(attr);
		loadFolders(folder.subFolders, parent, prefix + "-");
		parent.appendChild(f);
	});
  }
  function loadAccounts(accounts) {
	  accounts.forEach((account) => {
		const a = document.createElement("optgroup");
		var attr = document.createAttribute("label");
		attr.value = account.name;
		a.setAttributeNode(attr);
		loadFolders(account.folders, a); 
		accountList.appendChild(a);
	  });
  }
	browser.accounts.list().then(loadAccounts, onError);
		
  let getting = browser.storage.sync.get("folder");
  getting.then(setCurrentChoice, onError);
}


document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
