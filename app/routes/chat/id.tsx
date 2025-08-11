import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from '~/components/ai-elements/conversation';
import { Message, MessageContent } from '~/components/ai-elements/message';
import {
    PromptInput,
    PromptInputButton,
    PromptInputModelSelect,
    PromptInputModelSelectContent,
    PromptInputModelSelectItem,
    PromptInputModelSelectTrigger,
    PromptInputModelSelectValue,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
} from '~/components/ai-elements/prompt-input';
import { GlobeIcon } from 'lucide-react';
import { useState } from 'react';
import { prisma } from '~/lib/prisma';
import type { Route } from './+types/id';
import { useChat } from '@ai-sdk/react';
// import { Response } from '~/components/ai-elements/response';


export async function loader(args: Route.LoaderArgs) {

    const models = await prisma.aIModel.findMany({
        select: {
            name: true,
            code: true,
        }
    })
    return { models }
}

export default function Threads({ loaderData }: Route.ComponentProps) {
    const [model, setModel] = useState(loaderData.models[0].code);
    const [prompt, setPrompt] = useState('');
    const { sendMessage, messages, status } = useChat()

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        sendMessage({ text: prompt }, { body: { model } })
        setPrompt('')
    }

    return (
        <div className="w-full 2xl:max-w-4xl lg:max-w-3xl mx-auto flex flex-col h-full px-5 md:px-0">
            <Conversation>
                <ConversationContent>
                    {messages.map((message) => (
                        <Message from={message.role} key={message.id}>
                            <MessageContent className='group-[.is-user]:bg-muted group-[.is-user]:text-foreground group-[.is-assistant]:bg-transparent'>
                                {message.parts.map((part, i) => {
                                    switch (part.type) {
                                        case 'text':
                                            return (
                                                <span key={`${message.id}-${i}`}>
                                                    {part.text}
                                                </span>
                                            );
                                        default:
                                            return null;
                                    }
                                })}
                            </MessageContent>
                        </Message>
                    ))}
                </ConversationContent>
                <ConversationScrollButton />
            </Conversation>
            <div className='pt-3 px-3 border-t border-l border-r rounded-t-xl mt-auto bg-muted'>
                <PromptInput onSubmit={handleSubmit} className="sticky rounded-t-md shadow-none border-t border-l border-r bottom-0 left-0 z-50">
                    <PromptInputTextarea onChange={(e) => { setPrompt(e.target.value) }} value={prompt} />
                    <PromptInputToolbar>
                        <PromptInputTools>
                            <PromptInputModelSelect
                                onValueChange={(value) => {
                                    setModel(value);
                                }}
                                value={model}
                            >
                                <PromptInputModelSelectTrigger>
                                    <PromptInputModelSelectValue />
                                </PromptInputModelSelectTrigger>
                                <PromptInputModelSelectContent>
                                    {loaderData.models.map((model) => (
                                        <PromptInputModelSelectItem key={model.code} value={model.code}>
                                            {model.name}
                                        </PromptInputModelSelectItem>
                                    ))}
                                </PromptInputModelSelectContent>
                            </PromptInputModelSelect>
                            <PromptInputButton>
                                <GlobeIcon size={16} />
                            </PromptInputButton>
                        </PromptInputTools>
                        <PromptInputSubmit
                            className="absolute right-1 bottom-1"
                            disabled={!prompt}
                            status={status}
                        />
                    </PromptInputToolbar>
                </PromptInput>
            </div>
        </div>
    )
}
