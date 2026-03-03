import { after } from "@lib/api/patcher";
import { onJsxCreate } from "@lib/api/react/jsx";
import { findByName } from "@metro";
import { useEffect, useState } from "react";

import { defineCorePlugin } from "..";

interface ZancordBadge {
    label: string;
    url: string;
}

const useBadgesModule = findByName("useBadges", false);

export default defineCorePlugin({
    manifest: {
        id: "zancord.badges",
        name: "Badges",
        version: "1.0.0",
        description: "Adds badges to user's profile",
        authors: [{ name: "pylixonly" }]
    },
    start() {
        const propHolder = {} as Record<string, any>;
        const badgeCache = {} as Record<string, ZancordBadge[]>;

        onJsxCreate("RenderedBadge", (_, ret) => {
            if (ret.props.id.match(/zancord-\d+-\d+/)) {
                Object.assign(ret.props, propHolder[ret.props.id]);
            }
        });

        after("default", useBadgesModule, ([user], r) => {
            const [badges, setBadges] = useState<ZancordBadge[]>(user ? badgeCache[user.userId] ??= [] : []);

            useEffect(() => {
                if (user) {
                    fetch(`https://raw.githubusercontent.com/pyoncord/badges/refs/heads/main/${user.userId}.json`)
                        .then(r => r.json())
                        .then(badges => setBadges(badgeCache[user.userId] = badges));
                }
            }, [user]);

            if (user) {
                badges.forEach((badges, i) => {
                    propHolder[`zancord-${user.userId}-${i}`] = {
                        source: { uri: badges.url },
                        id: `zancord-${i}`,
                        label: badges.label
                    };

                    r.push({
                        id: `zancord-${user.userId}-${i}`,
                        description: badges.label,
                        icon: "_",
                    });
                });
            }
        });
    }
});
