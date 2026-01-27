import { configure, InMemory } from "@zenfs/core";
import { IndexedDB } from "@zenfs/dom";

let isInitialized = false;

export async function initFileSystem() {
    if (isInitialized) return;

    try {
        await configure({
            mounts: {
                "/": InMemory,
                "/c": {
                    backend: IndexedDB,
                    name: "win98-c-drive",
                },
            },
        });
        isInitialized = true;
        console.log("ZenFS initialized successfully.");
    } catch (error) {
        console.error("Failed to initialize ZenFS:", error);
    }
}
