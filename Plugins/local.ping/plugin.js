
// local.ping

function verify() {
	sendRequest(site, "HEAD")
	.then((dictionary) => {
		const jsonObject = JSON.parse(dictionary);

		const responseStatus = jsonObject["status"];
		if (responseStatus == 200) {
			// NOTE: The responseUrl may not be the same as the original url if there was a redirect.
			const responseUrl = jsonObject["url"];
			
			let displayName = responseUrl;
			if (displayName.startsWith("https://")) {
				displayName = displayName.replace("https://", "");
			}
			else if (displayName.startsWith("http://")) {
				displayName = displayName.replace("http://", "");
			}
			if (displayName.endsWith("/")) {
				displayName = displayName.substring(0, displayName.length - 1);
			}
			
			processVerification(displayName);
		}
		else {
			processError(Error("Failed to load site"));
		}
	})
	.catch((requestError) => {
		processError(requestError);
	});
}

function load() {
	sendRequest(site, "HEAD")
	.then((dictionary) => {
		const jsonObject = JSON.parse(dictionary);

		const responseStatus = jsonObject["status"];
		if (responseStatus != 200) {
			let date = new Date();
			let uri = `${site}?{date.valueOf()}`;
			let content = `<p>Response from ${site} failed with HTTP ${responseStatus} response.`;
			const resultItem = Item.createWithUriDate(uri, date);
			resultItem.body = content;
			processResults([resultItem]);
		}
	})
	.catch((requestError) => {
		let date = new Date();
		let uri = `${site}?timestamp=${date.valueOf()}`;
		let content = `<p>Request to ${site} failed with <strong>${requestError}</strong></p>`;
		const resultItem = Item.createWithUriDate(uri, date);
		resultItem.body = content;
		processResults([resultItem]);
	});
}
