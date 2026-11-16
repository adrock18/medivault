import { useId, type FocusEventHandler, type Ref } from 'react'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { Check, ChevronDown, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

export type SelectOption = {
  value: string
  label: string
  description?: string
  icon?: LucideIcon
  disabled?: boolean
}

export type SelectProps = {
  options: readonly SelectOption[]
  value: string
  onValueChange: (value: string) => void
  id?: string
  name?: string
  disabled?: boolean
  required?: boolean
  compact?: boolean
  className?: string
  onBlur?: FocusEventHandler<HTMLButtonElement>
  ref?: Ref<HTMLButtonElement>
  'aria-label'?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

export function Select({
  options,
  value,
  onValueChange,
  name,
  disabled,
  required,
  compact = false,
  className,
  ...triggerProps
}: SelectProps) {
  const id = useId()
  const Icon = options.find((option) => option.value === value)?.icon
  return (
    <SelectPrimitive.Root
      items={options}
      name={name}
      value={value}
      disabled={disabled}
      required={required}
      onValueChange={(selected) => {
        if (selected !== null) onValueChange(selected)
      }}
    >
      <SelectPrimitive.Trigger
        {...triggerProps}
        data-slot="select-trigger"
        className={cn(
          'select-trigger',
          compact && 'select-trigger-compact',
          className,
        )}
      >
        {Icon && (
          <Icon
            aria-hidden="true"
            size={17}
            className="shrink-0 text-primary"
          />
        )}
        <SelectPrimitive.Value className="min-w-0 flex-1 truncate text-left" />
        <SelectPrimitive.Icon className="select-chevron ml-auto shrink-0 text-muted-foreground">
          <ChevronDown size={16} aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          sideOffset={8}
          align="start"
          alignItemWithTrigger={false}
          collisionPadding={12}
          className="z-[80] outline-none"
        >
          <SelectPrimitive.Popup className="select-popup">
            <SelectPrimitive.List className="select-list">
              {options.map(
                (
                  {
                    value: optionValue,
                    label,
                    description,
                    icon: OptionIcon,
                    disabled: itemDisabled,
                  },
                  index,
                ) => (
                  <SelectPrimitive.Item
                    key={optionValue}
                    value={optionValue}
                    disabled={itemDisabled}
                    aria-label={label}
                    aria-describedby={
                      description ? `${id}-${index}` : undefined
                    }
                    className="select-option"
                  >
                    {OptionIcon && (
                      <span className="select-option-icon">
                        <OptionIcon size={19} aria-hidden="true" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <SelectPrimitive.ItemText className="block break-words text-sm font-medium">
                        {label}
                      </SelectPrimitive.ItemText>
                      {description && (
                        <span
                          id={`${id}-${index}`}
                          className="mt-0.5 block text-xs text-muted-foreground"
                        >
                          {description}
                        </span>
                      )}
                    </span>
                    <span className="w-5 shrink-0 text-primary">
                      <SelectPrimitive.ItemIndicator>
                        <Check size={17} strokeWidth={2.5} aria-hidden="true" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                  </SelectPrimitive.Item>
                ),
              )}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
