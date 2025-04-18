import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Typography, useTheme } from '@mui/material'
import { SessionType, createMessage } from '../../shared/types'
import platform from '../packages/platform'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useSetAtom } from 'jotai'
import * as sessionActions from '../stores/sessionActions'
import {
    Settings2
} from 'lucide-react'
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import StopCircleRoundedIcon from '@mui/icons-material/StopCircleRounded';
import { cn } from '@/lib/utils'
import icon from '../static/icon.png'
import TextareaAutosize from 'react-textarea-autosize';
import { trackingEvent } from '@/packages/event'
import MiniButton from './MiniButton'
import _ from 'lodash'
import * as scrollActions from '@/stores/scrollActions'

export interface Props {
    currentSessionId: string
    currentSessionType: SessionType
}

export default function InputBox(props: Props) {
    const theme = useTheme()
    const setChatConfigDialogSession = useSetAtom(atoms.chatConfigDialogAtom)
    const { t } = useTranslation()
    const [messageInput, setMessageInput] = useState('')
    const [isMobile, setIsMobile] = useState(false)

    // Get current session state
    const session = sessionActions.getSession(props.currentSessionId)
    const lastMessage = session?.messages?.find(m => m.generating)
    const isGenerating = lastMessage?.generating

    const handleSubmit = (needGenerating = true) => {
        if (messageInput.trim() === '') {
            return
        }
        const newMessage = createMessage('user', messageInput)
        sessionActions.submitNewUserMessage({
            currentSessionId: props.currentSessionId,
            newUserMsg: newMessage,
            needGenerating,
        })

        setMessageInput('')
        trackingEvent('send_message', { event_category: 'user' })
    }

    const handleCancelRequest = () => {
        let session = sessionActions.getSession(props.currentSessionId)
        const generatingMsg = session?.messages?.find(m => m.generating);
        generatingMsg?.cancel?.();
    }


    const onMessageInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const input = event.target.value
        setMessageInput(input)
    }

    useEffect(() => {
        platform.isMobile().then(setIsMobile)
    }, [])

    const  onKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // on iOS and Android enter will behave as newline instead.
        if (event.key === 'Enter' && isMobile) {
           return
        }

        if (
            event.keyCode === 13 &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey
        ) {
            event.preventDefault()
            handleSubmit()
            return
        }
        if (event.keyCode === 13 && event.ctrlKey) {
            event.preventDefault()
            handleSubmit(false)
            return
        }
    }

    const onFocus = () => {
        if (!isMobile) return;
        scrollActions.scrollToBottom()
    }

    const [easterEgg, setEasterEgg] = useState(false)

    return (
        <div className='pl-2 pr-4'
            style={{
                borderTopWidth: '1px',
                borderTopStyle: 'solid',
                borderTopColor: theme.palette.divider,
                padding: '0 4px'
            }}
        >
            <div className={cn('w-full mx-auto flex flex-col')}>
                <div className='w-full pl-1 pb-2 flex-1 min-h-0'
                style={{
                    padding: '0',
                }}
                >
                    <TextareaAutosize
                        className={cn(
                            'w-full overflow-y-auto resize-none border-none outline-none',
                            'bg-transparent p-1'
                        )}
                        maxRows={15}
                        value={messageInput}
                        onChange={onMessageInput}
                        onKeyDown={onKeyDown}
                        onFocus={onFocus}
                        style={{
                            color: theme.palette.text.primary,
                            fontFamily: theme.typography.fontFamily,
                            fontSize: theme.typography.body1.fontSize,
                            lineHeight: 1.6
                        }}
                        placeholder={t('Type your question here...') || ''}
                    />
                    <div className='flex flex-row items-center'>
                    </div>
                </div>
                <div className='flex flex-row flex-nowrap justify-between py-1'>
                    <div className='flex flex-row items-center'>
                        <MiniButton className='mr-2 hover:bg-transparent' style={{ color: theme.palette.text.primary }}
                            onClick={() => {
                                setEasterEgg(true)
                                setTimeout(() => setEasterEgg(false), 1000)
                            }}
                        >
                            <img className={cn('w-5 h-5', easterEgg ? 'animate-spin' : '')} src={icon} />
                        </MiniButton>
                        <MiniButton className='mr-2' style={{ color: theme.palette.text.primary }}
                            onClick={() => setChatConfigDialogSession(sessionActions.getCurrentSession())}
                            tooltipTitle={
                                <div className='text-center inline-block'>
                                    <span>{t('Customize settings for the current conversation')}</span>
                                </div>
                            }
                            tooltipPlacement='top'
                        >
                            <Settings2 size='22' strokeWidth={1} />
                        </MiniButton>
                    </div>
                    <div className='flex flex-row items-center'>
                        <MiniButton
                            className='w-8 ml-2 hover:bg-gray-100 dark:hover:bg-gray-800'  // Add subtle hover
                            style={{
                                color: isGenerating
                                    ? theme.palette.error.main
                                    : theme.palette.primary.main,
                                backgroundColor: 'transparent',
                                margin: '0 auto',
                            }}
                            tooltipTitle={
                                <Typography variant="caption">
                                    {isGenerating
                                        ? t('Stop generating')
                                        : t('[Enter] send, [Shift+Enter] line break, [Ctrl+Enter] send without generating')}
                                </Typography>
                            }
                            tooltipPlacement='top'
                            onClick={isGenerating ? handleCancelRequest : () => handleSubmit()}
                        >
                            {isGenerating ? (
                                <StopCircleRoundedIcon/>
                            ) : (
                                <SendRoundedIcon/>
                            )}
                        </MiniButton>
                    </div>
                </div>
            </div>
        </div>
    )
}
