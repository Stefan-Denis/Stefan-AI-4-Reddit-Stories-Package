import server from './src/js/server.js'

export async function main() {
    await server()
}

if (process.argv.includes('--test')) await main()