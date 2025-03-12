import { useEffect, useState } from 'react'
import { useDiscordSdk } from '../hooks/useDiscordSdk'
import GameContainer from '../components/GameContainer'
/**
 * This is your Discord Activity's main component. Customize it as you like!
 *
 * Learn more:
 * https://robojs.dev/discord-activities
 */
export const Activity = () => {
	const { authenticated, discordSdk, session } = useDiscordSdk()
	const [channelName, setChannelName] = useState<string>()
	
	useEffect(() => {
		// Requesting the channel in GDMs (when the guild ID is null) requires
		// the dm_channels.read scope which requires Discord approval.
		if (!authenticated || !discordSdk.channelId || !discordSdk.guildId) {
			return
		}

		// Collect channel info over RPC
		// Enable authentication to see it! (App.tsx)
		discordSdk.commands.getChannel({ channel_id: discordSdk.channelId }).then((channel) => {
			if (channel.name) {
				setChannelName(channel.name)
			}
		})
	}, [authenticated, discordSdk])

	return (
		<div className="w-screen h-screen overflow-hidden">
			<GameContainer discordUser={{
				username: session?.user?.username || '',
				id: session?.user?.id || '',
				avatar: session?.user?.avatar || undefined,
				channelName: channelName || ''
			}} />
		</div>
	)
}
