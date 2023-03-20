import * as React from 'react'
import { TextInput, TextInputProps, View } from 'react-native'

import { MessageType } from '../../types'
import { L10nContext, ThemeContext, unwrap, UserContext } from '../../utils'
import {
  AttachmentButton,
  AttachmentButtonAdditionalProps,
} from '../AttachmentButton'
import {
  CircularActivityIndicator,
  CircularActivityIndicatorProps,
} from '../CircularActivityIndicator'
import { SendButton } from '../SendButton'
import styles from './styles'
import { useImperativeHandle } from 'react'

export interface InputTopLevelProps {
  /** Whether attachment is uploading. Will replace attachment button with a
   * {@link CircularActivityIndicator}. Since we don't have libraries for
   * managing media in dependencies we have no way of knowing if
   * something is uploading so you need to set this manually. */
  isAttachmentUploading?: boolean
  /** @see {@link AttachmentButtonProps.onPress} */
  onAttachmentPress?: () => void
  /** Will be called on {@link SendButton} tap. Has {@link MessageType.PartialText} which can
   * be transformed to {@link MessageType.Text} and added to the messages list. */
  onSendPress: (message: MessageType.PartialText) => void
  /** Controls the visibility behavior of the {@link SendButton} based on the
   * `TextInput` state. Defaults to `editing`. */
  sendButtonVisibilityMode?: 'always' | 'editing'
  textInputProps?: TextInputProps
  textInputMethodRef?: React.Ref<{ setText: (text: string) => void }>
}

export interface InputAdditionalProps {
  attachmentButtonProps?: AttachmentButtonAdditionalProps
  attachmentCircularActivityIndicatorProps?: CircularActivityIndicatorProps
}

export type InputProps = InputTopLevelProps & InputAdditionalProps

/** Bottom bar input component with a text input, attachment and
 * send buttons inside. By default hides send button when text input is empty. */
export const Input = ({
  attachmentButtonProps,
  attachmentCircularActivityIndicatorProps,
  isAttachmentUploading,
  onAttachmentPress,
  onSendPress,
  sendButtonVisibilityMode,
  textInputProps,
  textInputMethodRef,
}: InputProps) => {
  const l10n = React.useContext(L10nContext)
  const theme = React.useContext(ThemeContext)
  const user = React.useContext(UserContext)
  const { container, input, marginRight } = styles({ theme })

  // Use `defaultValue` if provided
  const text = React.useRef(textInputProps?.defaultValue ?? '')
  const [hasText, setHasText] = React.useState(!!text.current)
  const textInputRef = React.useRef<TextInput>(null)

  const handleChangeText = (newText: string) => {
    // Track local state in case `onChangeText` is provided and `value` is not
    text.current = newText
    textInputProps?.onChangeText?.(newText)
    setHasText(!!newText)
  }

  useImperativeHandle(
    textInputMethodRef,
    () => ({
      setText(newText: string) {
        text.current = newText
        textInputRef.current?.setNativeProps({ text: newText })
        textInputProps?.onChangeText?.(newText)
        setHasText(!!newText)
      },
    }),
    [textInputProps]
  )

  const handleSend = () => {
    const trimmedValue = text.current.trim()

    // Impossible to test since button is not visible when value is empty.
    // Additional check for the keyboard input.
    /* istanbul ignore next */
    if (trimmedValue) {
      onSendPress({ text: trimmedValue, type: 'text' })
      text.current = ''
      textInputRef.current?.setNativeProps({ text: '' })
      setHasText(false)
    }
  }

  return (
    <View style={container}>
      {user &&
        (isAttachmentUploading ? (
          <CircularActivityIndicator
            {...{
              ...attachmentCircularActivityIndicatorProps,
              color: theme.colors.inputText,
              style: marginRight,
            }}
          />
        ) : (
          !!onAttachmentPress && (
            <AttachmentButton
              {...unwrap(attachmentButtonProps)}
              onPress={onAttachmentPress}
            />
          )
        ))}
      <TextInput
        placeholder={l10n.inputPlaceholder}
        placeholderTextColor={`${String(theme.colors.inputText)}80`}
        underlineColorAndroid='transparent'
        returnKeyType='send'
        {...textInputProps}
        // Keep our implementation but allow user to use these `TextInputProps`
        style={[input, textInputProps?.style]}
        ref={textInputRef}
        onChangeText={handleChangeText}
        defaultValue={text.current}
        onSubmitEditing={handleSend}
      />
      {sendButtonVisibilityMode === 'always' ||
      (sendButtonVisibilityMode === 'editing' && user && hasText) ? (
        <SendButton onPress={handleSend} />
      ) : null}
    </View>
  )
}
