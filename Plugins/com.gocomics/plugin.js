
// com.gocomics

function verify() {
	if (comicId != null && comicId.length > 0) {
		let date = new Date();
		date.setDate(date.getDate() - 1); // https://stackoverflow.com/questions/5511323/calculate-the-date-yesterday-in-javascript
		
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
	
		const timestamp = String(year) + "/" + String(month).padStart(2, "0") + "/" + String(day).padStart(2, "0");

		const url = site + "/" + comicId + "/" + timestamp;
		sendRequest(url)
		.then((html) => {
			const properties = extractProperties(html);
		
			const title = properties["og:title"];
			if (title != null) {
				const displayName = title.replace(/ by.*$/, "");
				const verifcation = {
					displayName: displayName,
					icon: "https://assets.gocomics.com/assets/favicons/favicon-96x96-92f1ac367fd0f34bc17956ef33d79433ddbec62144ee17b40add7a6a2ae6e61a.png"	
				};
				processVerification(verifcation);
			}
			else {
				processError(Error("Invalid Comic ID"));
			}
		})
		.catch((requestError) => {
			processError(requestError);
		});
	}
	else {
		processError(Error("Missing Comic ID"));
	}
}


/*
 NOTE: This plugin relies on the meta properties in the HTML. They are obtained by the extractProperties() function
 supplied by Tapestry.
 
 This is a sample of what the properties look like:
 
 <meta property="og:url" content="https://www.gocomics.com/nancy/2023/04/03" />
 <meta property="og:type" content="article" />
 <meta property="og:title" content="Nancy by Olivia Jaimes for April 03, 2023 | GoComics.com" />
 <meta property="og:image" content="https://assets.amuniversal.com/e7430910aeeb013bef63005056a9545d" />
 <meta property="og:image:height" content="276" />
 <meta property="og:image:width" content="900" />
 <meta property="og:description" content="" />
 <meta property="og:site_name" content="GoComics" />
 <meta property="fb:app_id" content="1747171135497727" />
 
 <meta property="article:published_time" content="2023-04-03" />
 <meta property="article:author" content="Olivia Jaimes" />
 <meta property="article:section" content="comic" />
 <meta property="article:tag" content="" />
 */

// NOTE: Regular expressions can be used to extract information from the HTML, too.
const avatarRegex = /<div class="gc-avatar gc-avatar--creator xs"><img[^]*?src="(.*)"/

var lastTimestamp = null

function load() {
	const date = new Date();
	
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	
	const timestamp = String(year) + "/" + String(month).padStart(2, "0") + "/" + String(day).padStart(2, "0");
	
	if (timestamp == lastTimestamp) {
		return;
	}
	
	const url = site + "/" + comicId + "/" + timestamp;
	sendRequest(url)
	.then((html) => {
		const properties = extractProperties(html);
		
		const image = properties["og:image"];
		const title = properties["og:title"];
		const siteName = properties["og:site_name"];
		const author = properties["article:author"];
		
		if (image != null) {
			const media = image;
			const attachment = Attachment.createWithMedia(media);
			attachment.text = title;
			
			const text = title.replace(/\| GoComics.com$/, "at <a href=\"" + url + "\">" + siteName + "</a>");
			const content = "<p>" + text + "</p>";
			
			const item = Item.createWithUriDate(url, date);
			item.body = content;
			item.attachments = [attachment];

			const match = html.match(avatarRegex);
			const avatar = match[1];

			let identity = null;
			if (author != null) {
				identity = Identity.createWithName(author);
				identity.uri = site + "/" + comicId;
				identity.avatar = avatar;
			}
			item.author = identity;
			
			processResults([item]);
			
			lastTimestamp = timestamp;
		}
	})
	.catch((requestError) => {
		// NOTE: It's possible that the comic for the day has not been posted yet (timezones, yay). So fail silently.
		//processError(requestError);
	});
	
}
