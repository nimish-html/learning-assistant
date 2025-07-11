"use client"

import { ChevronDown } from "lucide-react"
import {
  Button as AriaButton,
  ButtonProps as AriaButtonProps,
  ListBox as AriaListBox,
  ListBoxProps as AriaListBoxProps,
  PopoverProps as AriaPopoverProps,
  Select as AriaSelect,
  SelectProps as AriaSelectProps,
  SelectValue as AriaSelectValue,
  SelectValueProps as AriaSelectValueProps,
  ValidationResult as AriaValidationResult,
  composeRenderProps,
  Text,
} from "react-aria-components"

import { cn } from "@/lib/utils"

import { FieldError, Label } from "@/components/ui/field"
import {
  ListBoxCollection,
  ListBoxHeader,
  ListBoxItem,
  ListBoxSection,
} from "@/components/ui/list-box"
import { Popover } from "@/components/ui/popover"

const Select = AriaSelect

const SelectItem = ListBoxItem

const SelectHeader = ListBoxHeader

const SelectSection = ListBoxSection

const SelectCollection = ListBoxCollection

const SelectValue = <T extends object>({
  className,
  ...props
}: AriaSelectValueProps<T>) => (
  <AriaSelectValue
    className={composeRenderProps(className, (className) =>
      cn(
        "line-clamp-1 data-[placeholder]:text-gray-500",
        className
      )
    )}
    {...props}
  />
)

const SelectTrigger = ({ className, children, ...props }: AriaButtonProps) => (
  <AriaButton
    className={composeRenderProps(className, (className) =>
      cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:cursor-not-allowed disabled:opacity-50",
        className
      )
    )}
    {...props}
  >
    {composeRenderProps(children, (children) => (
      <>
        {children}
        <ChevronDown aria-hidden="true" className="size-4 opacity-50" />
      </>
    ))}
  </AriaButton>
)

const SelectPopover = ({ className, ...props }: AriaPopoverProps) => (
  <Popover
    className={composeRenderProps(className, (className) =>
      cn("w-[--trigger-width] max-h-60", className)
    )}
    {...props}
  />
)

const SelectListBox = <T extends object>({
  className,
  ...props
}: AriaListBoxProps<T>) => (
  <AriaListBox
    className={composeRenderProps(className, (className) =>
      cn(
        "max-h-60 overflow-auto p-1 outline-none bg-white border border-gray-200 rounded-md shadow-lg",
        className
      )
    )}
    {...props}
  />
)

interface JollySelectProps<T extends object>
  extends Omit<AriaSelectProps<T>, "children"> {
  label?: string
  description?: string
  errorMessage?: string | ((validation: AriaValidationResult) => string)
  items?: Iterable<T>
  children: React.ReactNode | ((item: T) => React.ReactNode)
}

function JollySelect<T extends object>({
  label,
  description,
  errorMessage,
  children,
  className,
  items,
  ...props
}: JollySelectProps<T>) {
  return (
    <Select
      className={composeRenderProps(className, (className) =>
        cn("group flex flex-col gap-2", className)
      )}
      {...props}
    >
      <Label>{label}</Label>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      {description && (
        <Text className="text-sm text-gray-600" slot="description">
          {description}
        </Text>
      )}
      <FieldError>{errorMessage}</FieldError>
      <SelectPopover>
        <SelectListBox items={items}>{children}</SelectListBox>
      </SelectPopover>
    </Select>
  )
}

export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectPopover,
  SelectHeader,
  SelectListBox,
  SelectSection,
  SelectCollection,
  JollySelect,
}
export type { JollySelectProps } 