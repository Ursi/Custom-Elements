(()=>{
	let style = document.createElement('style');
	style.textContent = 'for ' + document.currentScript.getAttribute('src');
	document.head.appendChild(style);

	class TabElement extends HTMLElement {
		get content() {
			return this.getAttribute('content');
		}

		set content(content) {
			this.setAttribute('content', content);
		}

		get group() {
			return Object.defineProperties({}, {
				name: {
					get: ()=>{
						let groupAttr = this.getAttribute('group');
						return groupAttr ? groupAttr : this.parentElement.getAttribute('group');
					},
					set: groupName => {
						this.setAttribute('group', groupName);
					},
				},
				tabs: {
					get: ()=>{
						let tabs = new Set;
						for (let tabGroup of document.querySelectorAll(`tab-group[group='${this.group.name}']`)) {
							for (let elem of tabGroup.querySelectorAll("tab-select:not([group])")) {
								tabs.add(elem);
							}
						}

						for (let tabSelect of document.querySelectorAll(`tab-select[group='${this.group.name}']`)) {
							tabs.add(tabSelect);
						}

						return tabs;
					}
				},
				content: {
					get: ()=>{
						let content = new Set;
						for (let tabGroup of document.querySelectorAll(`tab-group[group='${this.group.name}']`)) {
							for (let elem of tabGroup.querySelectorAll("tab-content:not([group])")) {
								content.add(elem);
							}
						}

						for (let tabContent of document.querySelectorAll(`tab-content[group='${this.group.name}']`)) {
							content.add(tabContent);
						}

						return content;
					}
				},
			});
		}

		get selected() {
			return this.getAttribute('selected') === '' ? true : false;
		}

		set selected(bool) {
			if (bool) {
				this.setAttribute('selected', '');
			} else {
				this.removeAttribute('selected');
			}
		}
	}

	customElements.define('tab-group', class extends TabElement {});

	customElements.define('tab-select', class extends TabElement {
		constructor() {
			super()
			if (!this.constructor.style) {
				style.sheet.insertRule(`
					tab-select {
						display: block;
					}
				`);

				this.constructor.style = true;
			}
		}

		connectedCallback(){
			this.addEventListener('click', function(){
				if (!this.selected) {
					['tabs', 'content'].forEach(tabType => {
						for (let elem of this.group[tabType]) {
							if (elem.selected) {
								elem.selected = false;
								break;
							}
						}
					});

					this.selected = true;
					let content = this.contentElement;
					if (content) {
						content.selected = true;
					}
				}
			});
		}

		get contentElement() {
			for (let tabContent of this.group.content) {
				if (tabContent.content === this.content) {
					return tabContent
				}
			}
		}
	});

	customElements.define('tab-content', class extends TabElement {
		constructor() {
			super()
			if (!this.constructor.style) {
				[
					`
						tab-content {
							display: block;
						}
					`,
					`
						tab-content:not([selected]) {
							display: none;
						}
					`
				].forEach(rule => style.sheet.insertRule(rule));
				this.constructor.style = true;
			}
		}

		connectedCallback(){
			this.content = this.getAttribute('content'),
			this.selected = this.getAttribute('selected') === '' ? true : false;
		}
	});
})();
