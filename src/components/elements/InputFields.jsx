export function InputText({ label, value, required = false, fieldName, type = "text", placeholder = "", cbOnChange = (e) => { } }) {
    return (
        <div>
            <label className="block text-xs text-gray-500 mb-1 relative">
                {label}
                {required && <span className='text-red-500 font-semibold text-lg absolute ml-1 -mt-1'>*</span>}
            </label>
            <input
                name={fieldName}
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => cbOnChange(fieldName, e.target.value)}
                className={`w-full px-[10px] py-2 text-[13px] border border-gray-300 rounded-md focus:border-blue-500 outline-none`}
            />
        </div>
    );
}

export function InputTextWithIcon({
    label,
    fieldName,
    required = false,
    readOnly = false,
    prefix,
    value,
    type = "text",
    helper,
    inputClassName = "",
    readOnlyInputClassName = "",
    cbOnChange = (e) => { }
}) {
    return (
        <div className='relative'>
            <label className="block text-xs text-gray-500 mb-1">
                {label}
                {required && <span className='text-red-500 font-semibold text-lg absolute ml-1 -mt-1'>*</span>}
            </label>
            <div className="relative">
                <span className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center bg-gray-100 border border-r-0 rounded-l-md font-semibold text-gray-700">
                    {prefix ?? ''}
                </span>

                {readOnly ? (
                    <input
                        name={fieldName}
                        type={type}
                        value={value}
                        readOnly
                        className={`w-full pointer-events-none cursor-default pl-[52px] pr-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-900 ${readOnlyInputClassName}`}
                    />
                ) : (
                    <input
                        name={fieldName}
                        type={type}
                        value={value}
                        onChange={(e) => cbOnChange(fieldName, e.target.value)}
                        className={`w-full pl-[52px] pr-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-900 outline-none ${inputClassName}`}
                    />
                )}
            </div>

            {helper && (
                <span className="block mt-1 text-xs text-gray-500 leading-snug">
                    {helper}
                </span>
            )}
        </div>
    );
}
