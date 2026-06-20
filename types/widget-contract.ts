import type { IDBPDatabase } from "idb";
import type { SomaticoDB } from "./db";

/*
    Every widget's domain controller returns this shape. The orchestrator
    (composables/userPersonaEngine.ts) only ever sees this interface - it
    never imports a widget's internal types, components, or raw DB responses.

    If you are adding a widget and find yourself wanting to pass data
    not in this interface up to the orchestrator, that's a sigh the data belongs
    in an integration rule (utils/integrationRules.ts) rather than the widget contract.
*/

export interface DomainIntentProfile {
    domainId: string; // matches the widgetId used in widget_analytics
    intentWeight: number; //0-1 score representing how strongly this domain reflects the current user's intent
    confidence: number; //0-1 climbs with this domain's own data age, never a global timestamp
    associatedTags: string[]; // lowercase kaeyword tags this domain has surfaced
    canTriggerIntegrations: boolean; // true once confidence is high enough to trigger integrations rules based on this domain
}

/*
    Every domain controller file (utils/domains/*.ts) must export one function
    matching this signature. Register it in usePersonaEngine.ts's domainAnalyzers
    array, that registration line is the only edit a new widget makes to a shared file
*/

export type DomainAnalyzer = (db: IDBPDatabase<SomaticoDB>) => Promise<DomainIntentProfile>