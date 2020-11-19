import {Client, VoiceChannel, VoiceState} from "discord.js"
import {GlobalContext} from "./GlobalContext"
import {Logger} from "./Logger"

const TAG = 'Lifecycle'

export namespace Lifecycle {
    export function registerJoinOnJoin(client: Client) {
        client.on('voiceStateUpdate', (oldState, newState) => {
            if (!hasUserJoinedChannel(oldState, newState)) {
                if (hasUserLeftChannel(oldState, newState)) {
                    // if (isItself(client, newState)) {
                    //     GlobalContext.get(newState.guild.id).then(context => {
                    //         context.getProvider().getVoiceConnectionHandler().disconnect()
                    //     })
                    // }
                    GlobalContext.get(oldState.guild.id).then(context => {
                        context.getProvider().getVoiceConnectionHandler().userLeftChannel(oldState.member.user)
                    })
                }
                if (hasUserChangedChannel(oldState, newState)) {
                    if (isItself(client, newState)) {
                        Logger.w(null, TAG, `Bot was moved from ${oldState.channel.name} to ${newState.channel.name} | New connection = ${newState.connection}`)
                        GlobalContext.get(newState.guild.id).then(context => {
                            context.getProvider().getVoiceConnectionHandler().joinVoiceChannel(newState.channel)
                        })
                        return
                    }
                    GlobalContext.get(oldState.guild.id).then(context => {
                        context.getProvider().getVoiceConnectionHandler().userChangedChannel(oldState)
                    })
                }
                return
            }
            if (isAlreadyInChannel(newState.channel, client.user.id)) {
                if (hasUserJoinedChannel(oldState, newState)) {
                    GlobalContext.get(newState.guild.id).then(context => {
                        context.getProvider().getVoiceConnectionHandler().userJoinedChannel(newState)
                    })
                }
                return
            }
            GlobalContext.get(newState.guild.id).then(context => {
                context.getProvider().getVoiceConnectionHandler().joinVoiceChannel(newState.channel)
            })
        })
    }

    function isItself(client: Client, voiceState: VoiceState): boolean {
        return client.user.id === voiceState.member.user.id
    }

    function isAlreadyInChannel(channel: VoiceChannel, botId: string): boolean {
        try {
            // @ts-ignore
            channel.guild.channels.cache.filter(channel => channel.type === 'voice').forEach(channel => {
                channel.members.forEach(member => {
                    if (member.user && member.user.id === botId) {
                        throw Error()
                    }
                })
            })
        } catch {
            return true
        }
        return false
    }

    function hasUserJoinedChannel(oldState: VoiceState, newState: VoiceState): boolean {
        return oldState.channel == undefined && newState.channel != undefined
    }

    function hasUserLeftChannel(oldState: VoiceState, newState: VoiceState): boolean {
        return oldState.channel != undefined && newState.channel == undefined
    }

    function hasUserChangedChannel(oldState: VoiceState, newState: VoiceState): boolean {
        return (oldState.channel && newState.channel) && (oldState.channelID !== newState.channelID)
    }
}
