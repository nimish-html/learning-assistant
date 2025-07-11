"use client"

import { Check } from "lucide-react"
import {
  Collection as AriaCollection,
  Header as AriaHeader,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxItemProps as AriaListBoxItemProps,
  ListBoxProps as AriaListBoxProps,
  Section as AriaSection,
  composeRenderProps,
} from "react-aria-components"

import { cn } from "@/lib/utils"

const ListBoxSection = AriaSection

const ListBoxCollection = AriaCollection

function ListBox<T extends object>({
  className,
  ...props
}: AriaListBoxProps<T>) {
  return (
    <AriaListBox
      className={composeRenderProps(className, (className) =>
        cn(
          "group overflow-auto rounded-md border border-gray-200 bg-white p-1 shadow-md outline-none",
          "data-[empty]:p-6 data-[empty]:text-center data-[empty]:text-sm",
          className
        )
      )}
      {...props}
    />
  )
}

const ListBoxItem = <T extends object>({
  className,
  children,
  ...props
}: AriaListBoxItemProps<T>) => {
  return (
    <AriaListBoxItem
      textValue={
        props.textValue || (typeof children === "string" ? children : undefined)
      }
      className={composeRenderProps(className, (className) =>
        cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          "data-[focused]:bg-gray-100 data-[focused]:text-gray-900",
          "data-[hovered]:bg-gray-100 data-[hovered]:text-gray-900",
          "data-[selection-mode]:pl-8",
          className
        )
      )}
      {...props}
    >
      {composeRenderProps(children, (children, renderProps) => (
        <>
          {renderProps.isSelected && (
            <span className="absolute left-2 flex size-4 items-center justify-center">
              <Check className="size-4" />
            </span>
          )}
          {children}
        </>
      ))}
    </AriaListBoxItem>
  )
}

function ListBoxHeader({
  className,
  ...props
}: React.ComponentProps<typeof AriaHeader>) {
  return (
    <AriaHeader
      className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
      {...props}
    />
  )
}

export {
  ListBox,
  ListBoxItem,
  ListBoxHeader,
  ListBoxSection,
  ListBoxCollection,
} 