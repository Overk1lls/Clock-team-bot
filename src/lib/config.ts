export const discordBotTagChannels = [
    '896363996029005854',
    '672667309906853899'
];

export const COMMANDS = {
    CHECK: '!check',
    REALMS: '!realms',
    TOKEN: '!token',
    WISHLIST: '!wish',
    COMMANDS: '!commands'
};

export const RESPONSES = {
    NOT_RECOGNIZED: 'I don\'t recognize this command!',
    REALMS_UP: 'Realms are up and already working!',
    NO_KEYS: 'No recent 20+ keys done :(',
    SOMETHING_WRONG: 'Something went wrong...',
    ALREADY_SUBBED: 'You\'ve already subscribed!',
    SUB_RESPONSE: 'Starting to check the server every minute, will ping you if server is up',
    SERVER_UP: 'Server status is up. Realms are available!',
    ALREADY_PRIORITIZED: 'Вы эту вещь добавляли ранее, приоритет уже назначен!',
    COMMANDS: '> Lists of available commands:\n' +
        '> **!check** name-realm [all] - checks a character for the recent mythic+ runs. If there is no ALL flag, then responses only 20+ keys done. For example: !check Overkill-Kazzak all\n' +
        '> **!realms** [subscribe] [eu|us] - checks if realm servers are availabe at the moment. Use the SUBSCRIBE flag to subscribe to the bot, and get a message when servers will go live. Use the EU|US flag to set the region to check on\n' +
        '> **!token** [eu|us] - checks the WoW token gold price on the given region. Default region is US\n'      
};

export const SHEETS_INDEXES = {
    WISHLIST: 0
};