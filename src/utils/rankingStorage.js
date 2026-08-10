import { supabase } from "../lib/supabaseClient";

function mapRankingEntry(row) {
    return {
        id: row.id,
        className: row.class_name || "",
        position: Number(row.position) || 0,
        lastName: row.last_name || "",
        firstName: row.first_name || "",
        name: row.full_name || `${row.first_name || ""} ${row.last_name || ""}`.trim(),
        club: row.club || "",
        category: row.category || "",
        netPoints: row.net_points === null || row.net_points === undefined
            ? null
            : Number(row.net_points),
        totalPoints: row.total_points === null || row.total_points === undefined
            ? null
            : Number(row.total_points),
        events: Number(row.events) || 0,
        eventsBreakdown: row.raw?.eventsBreakdown || {},
        profileId: row.profile_id || "",
        profileName: row.profile_name || "",
        profileImage: row.profile_image_url || ""
    };
}

function mapRankingProfileLink(row) {
    return {
        id: row.id,
        rankingName: row.ranking_name || "",
        rankingClub: row.ranking_club || "",
        normalizedName: row.normalized_name || "",
        normalizedClub: row.normalized_club || "",
        profileId: row.profile_id || "",
        profileName: row.profile_name || "",
        profileImage: row.profile_image_url || "",
        profileActive: Boolean(row.profile_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function mapEntryToPayload(entry) {
    return {
        class_name: entry.className || "",
        position: Number(entry.position) || 0,
        last_name: entry.lastName || "",
        first_name: entry.firstName || "",
        full_name: entry.name || `${entry.firstName || ""} ${entry.lastName || ""}`.trim(),
        club: entry.club || "",
        category: entry.category || "",
        net_points: entry.netPoints === null || entry.netPoints === undefined
            ? null
            : Number(entry.netPoints),
        total_points: entry.totalPoints === null || entry.totalPoints === undefined
            ? null
            : Number(entry.totalPoints),
        events: Number(entry.events) || 0,
        raw: {
            eventsBreakdown: entry.eventsBreakdown || {}
        }
    };
}

export async function getLatestPublishedRanking() {
    const { data: rankingImport, error: importError } =
        await supabase
            .from("ranking_imports")
            .select("*")
            .eq("status", "published")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

    if (importError) {
        throw importError;
    }

    if (!rankingImport) {
        return null;
    }

    let entries;

    const { data: enrichedEntries, error: enrichedEntriesError } =
        await supabase.rpc(
            "get_published_ranking_entries_with_profiles",
            {
                import_id_param: rankingImport.id
            }
        );

    if (!enrichedEntriesError) {
        entries = enrichedEntries || [];
    } else {
        const { data: baseEntries, error: baseEntriesError } =
            await supabase
                .from("ranking_entries")
                .select("*")
                .eq("import_id", rankingImport.id)
                .order("class_name", { ascending: true })
                .order("position", { ascending: true });

        if (baseEntriesError) {
            throw baseEntriesError;
        }

        entries = baseEntries || [];
    }

    return {
        metadata: {
            id: rankingImport.id,
            title: rankingImport.title,
            sourceFileName: rankingImport.source_file_name,
            sourceUrl: rankingImport.source_url || "",
            sourceType: rankingImport.source_type || "file",
            rowCount: rankingImport.row_count,
            createdAt: rankingImport.created_at
        },
        entries: (entries || []).map(mapRankingEntry)
    };
}

export async function getActiveRankingSource() {
    const { data, error } =
        await supabase
            .from("ranking_sources")
            .select("*")
            .eq("is_active", true)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        return null;
    }

    return {
        id: data.id,
        name: data.name || "Ranking externo",
        sourceUrl: data.source_url || "",
        sourceType: data.source_type || "url",
        updatedAt: data.updated_at,
        createdAt: data.created_at
    };
}

export async function saveRankingSource({
    name,
    sourceUrl,
    sourceType = "url"
}) {
    if (!sourceUrl?.trim()) {
        throw new Error("Pegá una URL pública del ranking.");
    }

    const { data, error } =
        await supabase.rpc("upsert_ranking_source", {
            source_name_param: name || "Ranking externo",
            source_url_param: sourceUrl.trim(),
            source_type_param: sourceType || "url"
        });

    if (error) {
        throw error;
    }

    return data;
}

export async function publishRankingImport({
    title,
    sourceFileName,
    sourceUrl = "",
    sourceType = "file",
    entries
}) {
    if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error("No hay registros de ranking para publicar.");
    }

    const payload = entries.map(mapEntryToPayload);

    const { data, error } =
        await supabase.rpc("publish_ranking_import_v2", {
            import_title_param: title || "Ranking",
            source_file_name_param: sourceFileName || "",
            source_url_param: sourceUrl || "",
            source_type_param: sourceType || "file",
            entries_param: payload
        });

    if (error) {
        throw error;
    }

    return data;
}

export async function getRankingProfileLinks() {
    const { data, error } =
        await supabase.rpc("get_ranking_profile_links");

    if (error) {
        throw error;
    }

    return (data || []).map(mapRankingProfileLink);
}

export async function saveRankingProfileLink({
    rankingName,
    rankingClub,
    profileId
}) {
    if (!rankingName?.trim()) {
        throw new Error("El timonel no tiene un nombre válido.");
    }

    if (!profileId) {
        throw new Error("Seleccioná un perfil profesional.");
    }

    const { data, error } =
        await supabase.rpc("upsert_ranking_profile_link", {
            ranking_name_param: rankingName.trim(),
            ranking_club_param: rankingClub?.trim() || "",
            profile_id_param: profileId
        });

    if (error) {
        throw error;
    }

    return data;
}

export async function removeRankingProfileLink(linkId) {
    if (!linkId) {
        return;
    }

    const { error } =
        await supabase.rpc("delete_ranking_profile_link", {
            link_id_param: linkId
        });

    if (error) {
        throw error;
    }
}
