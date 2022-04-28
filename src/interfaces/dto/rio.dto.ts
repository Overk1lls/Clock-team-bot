export interface IRioChar {
    name: string,
    class: string,
    mythic_plus_recent_runs: [{
        dungeon: string,
        short_name: string,
        mythic_level: number,
        completed_at: Date,
        num_keystone_upgrades: number,
        url: string,
    }],
    statusCode?: number,
    message?: string,
}
