import { useEffect, useRef, useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react'
import EmojiIcon from '../../icons/EmojiIcon';

interface IEmojiPickerParams {
    showEmojiPicker: boolean;
    setShowEmojiPicker: (arg: boolean) => void;
    onSelectEmoji: (e: Record<string, any>) => any;
}

function EmojiPicker({ showEmojiPicker, setShowEmojiPicker, onSelectEmoji }: IEmojiPickerParams) {
    const buttonRef = useRef<HTMLDivElement>(null);

    function handleEmojiSelect(emoji: Record<string, any>) {
        setShowEmojiPicker(false);
        onSelectEmoji(emoji);
    };

    function handleToggleEmojiPicker() {
        setShowEmojiPicker(!showEmojiPicker);
    }

    const calculatePickerPosition = () => {
        if (!buttonRef.current) {
            return
        }

        const buttonRect = buttonRef.current.getBoundingClientRect();
        const bottom =  buttonRect.height * 2;
        const right = buttonRect.width;
        return { bottom, right };
    };

    return (
        <>
            <div
                ref={buttonRef}
                className="flex cursor-pointer flex-col items-center rounded-lg bg-lc-fg-light px-2 py-2 transition-all hover:bg-lc-fg-hover-light dark:bg-lc-fg dark:hover:bg-lc-fg-hover"
                onClick={handleToggleEmojiPicker}
            >
                <EmojiIcon />
            </div>

            <div
                className="absolute z-10"
                style={calculatePickerPosition()}
            >
                {showEmojiPicker && 
                    <Picker data={data} onEmojiSelect={handleEmojiSelect} />
                }
            </div>
        </>
    );
};

export default EmojiPicker;