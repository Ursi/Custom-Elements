(()=>{
	let style = document.createElement(`style`);
	style.textContent = `/*for ${document.currentScript.getAttribute(`src`)}*/`;
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
						const
							content = new Set,
							tabGroupSelector = `tab-group[group='${this.group.name}']`;

						for (let tabGroup of document.querySelectorAll(tabGroupSelector)) {
							for (let elem of tabGroup.querySelectorAll(`${tabGroupSelector} > tab-content:not([group])`)) {
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
		constructor() {
			super();
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
		constructor() {
			super();
			this.attachShadow({mode: `open`});
		}

		connectedCallback() {
			const
				{
					size,
					disks,
					spacing,
					color,
					period,
					shadowRoot,
				} = this,
				diskSize = `calc(${1 - spacing} * ${size} / ${1 - spacing + 1 / Math.sin(Math.PI / disks)})`;

			this.styleElem = document.createElement(`style`);
			shadowRoot.appendChild(this.styleElem);
			[`
				@keyframes disk-loader {
					from {
						opacity: 1;
					} to {
						opacity: 0;
					}
				}
			`,`
				:host {
					display: inline-block;
					width: ${size};
					height: ${size};
				}
			`,`
				:host > div {
					position: absolute;
					width: ${diskSize};
					height: ${diskSize};
					border-radius: calc(${diskSize} / 2);
					background: ${color};
					transform-origin: center calc(${size} / 2);
					animation: linear infinite disk-loader;
					animation-duration: ${period}s;
				}
			`].forEach(rule => this.styleElem.sheet.insertRule(rule));

			this.diskElems = [];
			for (let i = 0; i <= disks - 1; i++) {
				const disk = document.createElement(`div`);
				disk.style.transform = `translateX(calc((${size} - ${diskSize}) / 2)) rotate(${i / disks}turn)`;
				disk.style.animationDelay = `${period * (i - disks) / disks}s`;
				this.diskElems.push(disk);
				shadowRoot.appendChild(disk);
			}
		}

		disconnectedCallback() {
			const {shadowRoot} = this;
			let child;
			while (child = shadowRoot.firstChild) {
				child.remove();
			}
		}

		static get observedAttributes() {return [
			`color`,
			`disks`,
			`period`,
			`size`,
			`spacing`,
		];}

		attributeChangedCallback(attr) {
			if (this.isConnected) {
				const style = this.styleElem.sheet.rules[0].style;
				let
					diskElems,
					disks,
					diskSize,
					size,
					spacing;

				switch (attr) {
					case `color`:
						style.background = this.color; break;
					case `disks`:
						const {shadowRoot} = this
						let child;
						while (child = shadowRoot.firstChild) child.remove();
						this.connectedCallback(); break;
					case `period`:
						const {period} = this;
						disks = this.disks;
						style.animationDuration = period + `s`;
						diskElems = this.diskElems;
						for (let i = 0; i < diskElems.length; i++) {
							diskElems[i].style.animationDelay = `${period * (i - disks) / disks}s`
						} break;
					case `size`:
						const hostStyle = this.styleElem.sheet.rules[1].style;
						disks = this.disks;
						size = this.size;
						spacing = this.spacing;
						diskSize = `calc(${1 - spacing} * ${size} / ${1 - spacing + 1 / Math.sin(Math.PI / disks)})`;
						hostStyle.width = size;
						hostStyle.height = size;
						Object.assign(style, {
							width: diskSize,
							height: diskSize,
							borderRadius: `calc(${diskSize} / 2)`,
							transformOrigin: `center calc(${size} / 2)`,
						});

						diskElems = this.diskElems;
						for (let i = 0; i < diskElems.length; i++) {
							diskElems[i].style.transform = `translateX(calc((${size} - ${diskSize}) / 2)) rotate(${i / disks}turn)`;
						} break;
					case `spacing`:
						disks = this.disks;
						size = this.size;
						spacing = this.spacing;
						diskSize = `calc(${1 - spacing} * ${size} / ${1 - spacing + 1 / Math.sin(Math.PI / disks)})`;
						Object.assign(style, {
							width: diskSize,
							height: diskSize,
							borderRadius: `calc(${diskSize} / 2)`
						});

						diskElems = this.diskElems
						for (let i = 0; i < diskElems.length; i++) {
							diskElems[i].style.transform = `translateX(calc((${size} - ${diskSize}) / 2)) rotate(${i / disks}turn)`;
						} break;
				}
			}
		}

		get color() {
			return this.getAttribute(`color`) || `#0005`;
		}

		set color(value) {
			this.setAttribute(`color`, value);
		}

		get disks() {
			return this.getAttribute(`disks`) || 6;
		}

		set disks(value) {
			this.setAttribute(`disks`, value);
		}

		get period() {
			return this.getAttribute(`period`) || 1;
		}

		set period(value) {
			this.setAttribute(`period`, value);
		}

		get size() {
			return this.getAttribute(`size`) || `1em`;
		}

		set size(value) {
			this.setAttribute(`size`, value);
		}

		get spacing() {
			return this.getAttribute(`spacing`) || 1 / 3;
		}

		set spacing(value) {
			this.setAttribute(`spacing`, value);
		}
	});
})();
