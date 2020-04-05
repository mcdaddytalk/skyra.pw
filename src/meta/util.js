import { BASE_API_URL, history, Time } from 'meta/constants';
import { getGlobal, setGlobal, useEffect, useRef } from 'reactn';

export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function useTraceUpdate(props) {
	const prev = useRef(props);
	useEffect(() => {
		const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
			if (prev.current[k] !== v) {
				ps[k] = [prev.current[k], v];
			}
			return ps;
		}, {});
		if (Object.keys(changedProps).length > 0) {
			// Do nothing
		}
		prev.current = props;
	});
}

export function logOut() {
	localStorage.clear();
	setGlobal({ user: null, token: null, authenticated: false });
	history.replace('/');
}

export const loadState = key => {
	try {
		const serializedState = localStorage.getItem(key);
		if (serializedState === null) {
			return undefined;
		}
		return JSON.parse(serializedState);
	} catch (err) {
		return undefined;
	}
};

export const saveState = (key, state) => {
	try {
		const serializedState = JSON.stringify(state);
		localStorage.setItem(key, serializedState);
	} catch (err) {
		// intentionally empty
	}
};

export async function apiFetch(path, options = {}) {
	if (process.env.NODE_ENV === 'development') {
		await sleep(1000);
	}
	if (options.body) options.body = JSON.stringify(options.body);
	if (!options.headers) options.headers = {};
	options.headers['Content-Type'] = 'application/json';

	const response = await fetch(`${BASE_API_URL}${path}`, options);

	const jsonResponse = await response.json();

	if (jsonResponse.error) {
		throw response;
	} else {
		return jsonResponse;
	}
}

export async function authedFetch(path, options = { headers: {} }) {
	if (!options.headers) options.headers = {};
	options.headers.authorization = getGlobal().token;
	return apiFetch(path, options);
}

export async function syncUser() {
	// If they're not logged in, don't try to sync.
	if (!getGlobal().authenticated) return;

	// Check if they've synced in the past 5 minutes.
	const lastSync = loadState('last_sync');
	const difference = Date.now() - lastSync;
	if (difference < Time.Minute * 5) {
		return;
	}

	saveState('last_sync', Date.now());

	const response = await authedFetch('/oauth/user', {
		method: 'POST',
		body: {
			action: 'SYNC_USER'
		}
	}).catch(err => {
		// TODO toast
		if (err.status === 401) logOut();
	});

	if (!response) return;

	if (response.user) {
		saveState('discord_user', response.user);
		setGlobal({ user: response.user });
	}

	if (response.access_token) {
		saveState('discord_token', response.access_token);
		setGlobal({ token: response.access_token });
	}
}

export function navigate(path) {
	if (path.startsWith('http')) {
		return () => (window.location.href = path);
	}
	return () => history.push(path);
}

export function toTitleCase(str) {
	const splitStr = str.toLowerCase().replace(/-/g, ' ').split(' ');
	for (let i = 0; i < splitStr.length; i++) {
		splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
	}
	return splitStr.join(' ');
}

export function displayAvatarURL(user, { format = 'default', size = 256 } = {}) {
	if (!user) return `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 4) + 1}.png`;
	if (user.avatar === null) return `https://cdn.discordapp.com/embed/avatars/${user.discriminator}.png`;
	if (format === 'default') format = user.avatar.startsWith('a_') ? 'gif' : 'webp';
	return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${format}${`?size=${size}`}`;
}

export function displayIconURL(guild, { format = 'default', size = 256 } = {}) {
	if (guild.icon === null) return null;
	if (format === 'default') format = guild.icon.startsWith('a_') ? 'gif' : 'webp';
	return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${format}${`?size=${size}`}`;
}

export function getAcronym(name) {
	return name
		.replace(/\w+/g, part => part[0])
		.replace(/\s/g, '')
		.slice(0, 2);
}

export function removeNonAlphaNumeric(str) {
	return str.replace(/[^0-9a-zA-Z]/gi, '');
}

/**
 * Check if a bit is set in a bitfield.
 * @param {number} bits The bitfield value to check.
 * @param {number} bit The bit to check.
 */
export function bitwiseHas(bits, bit) {
	return (bits & bit) === bit;
}

/**
 * Toggle a bit in a bitfield.
 * @param {number} bits The bitfield value to modify.
 * @param {number} bit The bit to toggle.
 * @param {boolean} toggle The value to set.
 */
export function bitwiseSet(bits, bit, toggle) {
	return toggle ? bits | bit : bits & ~bit;
}

/**
 * No operation function
 */
export function noOp() {
	return undefined;
}

/**
 * Split a string by its latest space character in a range from the character 0 to the selected one.
 * @param {string} str The text to split.
 * @param {number} length The length of the desired string.
 * @param {string} char The character to split with
 */
export function splitText(str, length, char = ' ') {
	const x = str.substring(0, length).lastIndexOf(char);
	const pos = x === -1 ? length : x;
	return str.substring(0, pos);
}

/**
 * Split a text by its latest space character in a range from the character 0 to the selected one.
 * @param {string} str The text to split.
 * @param {number} length The length of the desired string.
 */
export function cutText(str, length) {
	if (str.length < length) return str;
	const cut = splitText(str, length - 3);
	if (cut.length < length - 3) return `${cut}...`;
	return `${cut.slice(0, length - 3)}...`;
}
