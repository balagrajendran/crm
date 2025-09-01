import * as React from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { Controller, Control } from 'react-hook-form';
import { useLazySearchSuppliersQuery } from '../services/api';

type SupplierOption = { code: string; name?: string };

type Props = {
  control: Control<any>;
  name: string;                // e.g., 'supplierCode'
  label?: string;
  disabled?: boolean;
  onPicked?: (opt: SupplierOption) => void;
  minChars?: number;
};

export default function SupplierAutocompleteMUI({
  control,
  name,
  label = 'Supplier Code',
  disabled,
  onPicked,
  minChars = 2,
}: Props) {
  const [input, setInput] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const isSelectingRef = React.useRef(false);

  const [trigger, { data, isFetching }] = useLazySearchSuppliersQuery();

React.useEffect(() => {
  const q = input.trim();
  // Prevent API call if selecting from list
  if (isSelectingRef.current || q.length < minChars) { setOpen(false); return; }
  const t = setTimeout(() => {
    trigger({ q, limit: 10 });
    setOpen(true);
  }, 250);
  return () => clearTimeout(t);
}, [input, minChars, trigger]);

  const options = data?.data ?? [];

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Autocomplete
          freeSolo
          blurOnSelect
          open={open}
          onOpen={() => {
            // only open if user is typing (not right after a selection)
            if (!isSelectingRef.current && input.trim().length >= minChars) {
              setOpen(true);
            }
          }}
          onClose={() => setOpen(false)}
          options={options}
          getOptionLabel={(o) => (typeof o === 'string' ? o : o.code)}
          isOptionEqualToValue={(o, v) =>
            (typeof o === 'string' ? o : o.code) === (typeof v === 'string' ? v : v?.code)
          }
          inputValue={input}
          onInputChange={(_, val, reason) => {
            // Ignore the synthetic reset that happens after selection
            if (reason === 'reset') return;
            // Also ignore if we're in the middle of a programmatic set from selection
            if (isSelectingRef.current) return;

            setInput(val);
            field.onChange(val); // keep form in sync while typing
          }}
          onChange={(_, val) => {
            // User picked an item or typed free text
            isSelectingRef.current = true;

            if (val && typeof val !== 'string') {
              field.onChange(val.code);
              setInput(val.code);
              onPicked?.(val);
            } else if (typeof val === 'string') {
              field.onChange(val);
              setInput(val);
            } else {
              field.onChange('');
              setInput('');
            }

            // Close popup and clear selecting flag after the microtask
            setOpen(false);
            // allow next ticks to process before enabling re-open
            setTimeout(() => { isSelectingRef.current = false; }, 0);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              //label={label}
              size="small"
              disabled={disabled}
              value={field.value || ''}
              onChange={(e) => {
                // keep RHF value and our input in sync
                const v = e.target.value;
                field.onChange(v);
                setInput(v);
              }}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isFetching ? <CircularProgress color="inherit" size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      )}
    />
  );
}
