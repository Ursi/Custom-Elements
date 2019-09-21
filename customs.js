(()=>{
	let style = document.createElement(`style`);
	style.textContent = `/*for ${document.currentScript.getAttribute(`src`)}/*`;
	document.head.appendChild(style);
	[`
		tab-group {
			display: contents;
		}
	`,`
		tab-select {
			cursor: default;
		}
	`,`
		tab-content:not([selected]) {
			display: none;
		}
	`,`
		disk-loader {
			display: inline-block;
		}
	`,`
		@keyframes disk-loader {
			from {
				opacity: 1;
			} to {
				opacity: 0;
			}
		}
	`].forEach(rule => style.sheet.insertRule(rule));

	class TabElement extends HTMLElement {
		get content() {
			return this.getAttribute(`content`);
		}

		set content(content) {
			this.setAttribute(`content`, content);
		}

		get group() {
			return Object.defineProperties({}, {
				name: {
					get: ()=>{
						let groupAttr = this.getAttribute(`group`);
						return groupAttr ? groupAttr : this.parentElement.getAttribute(`group`);
					},
					set: groupName => {
						this.setAttribute(`group`, groupName);
					},
				},
				tabs: {
					get: ()=>{
						let tabs = new Set;
						for (let tabGroup of document.querySelectorAll(`tab-group[group='${this.group.name}']`)) {
							for (let elem of tabGroup.querySelectorAll(`tab-select:not([group])`)) {
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
							for (let elem of tabGroup.querySelectorAll(`tab-content:not([group])`)) {
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
			return this.getAttribute(`selected`) === `` ? true : false;
		}

		set selected(bool) {
			if (bool) {
				this.setAttribute(`selected`, ``);
			} else {
				this.removeAttribute(`selected`);
			}
		}
	}

	customElements.define(`tab-group`, class extends TabElement {});

	customElements.define(`tab-select`, class extends TabElement {
		connectedCallback(){
			this.addEventListener(`click`, function(){
				if (!this.selected) this.select();
			});
		}

		get contentElements() {
			let content = [];
			for (let tabContent of this.group.content) {
				if (tabContent.content === this.content) {
					content.push(tabContent);
				}
			}

			return content;
		}

		select() {
			[`tabs`, `content`].forEach(tabType => {
				for (let elem of this.group[tabType]) {
					if (elem.selected) {
						elem.selected = false;
						if (tabType === `tabs`) break;
					}
				}
			});

			this.selected = true;
			let content = this.contentElements;
			if (content.length) {
				for (let elem of content) elem.selected = true;
			}
		}
	});

	customElements.define('tab-content', class extends TabElement {});
	addEventListener('DOMContentLoaded', function(){
		for (let tab of document.querySelectorAll('tab-select[default]')) {
			tab.select();
		}
	});

	customElements.define(`disk-loader`, class extends HTMLElement {
		connectedCallback(){
			const
				size = this.getAttribute(`size`) || `1em`,
				disks = this.getAttribute(`disks`) || 6,
				spacing = this.getAttribute(`spacing`) || 1 / 3,
				color = this.getAttribute(`color`) || `#0005`,
				period = this.getAttribute(`period`) || 1;

			Object.assign(this.style, {
				width: size,
				height: size,
			});

			for (let i = 0; i <= disks - 1; i++) {
				const
					disk = document.createElement(`div`),
					diskSize = `calc(${1 - spacing} * ${size} / ${1 - spacing + 1 / Math.sin(Math.PI / disks)})`;

				Object.assign(disk.style, {
					width: diskSize,
					height: diskSize,
					borderRadius: `calc(${diskSize} / 2)`,
					background: color,
					position: `absolute`,
					transformOrigin: `center calc(${size} / 2)`,
					transform: `translateX(calc((${size} - ${diskSize}) / 2)) rotate(${i / disks}turn)`,
					animation: `${period}s linear ${period * (i - disks) / disks}s infinite disk-loader`,
				});

				this.appendChild(disk);
			}
		}
	});
})();
