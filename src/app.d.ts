// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			/** Id of the item whose details are open in a dialog or full-screen page. */
			item?: string;
		}
		// interface Platform {}
	}
}

export {};
