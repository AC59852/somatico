import type { DBSchema } from "idb";

export interface SomaticoDB extends DBSchema {
    widget_analytics: {
        key: number;
        value: {
            id?: number;
            widgetId: string; // must match the domainId used in that widget's contract response
            dwellTimeMs: number;
            idleTimeMs: number;
            timestamp: number;
        }
        indexes: { by_widget: string; by_timestamp: number; };
    }

    keywords: {
        key: number;
        value: {
            id?: number;
            word: string;
            source: string; // which widget surfaced this keyword
            timestamp: number;
        }
        indexes: { by_source: string; by_timestamp: number; };
    }
}