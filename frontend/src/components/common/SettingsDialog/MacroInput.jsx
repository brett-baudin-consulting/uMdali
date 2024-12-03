function MacroInput({ macro, onChange, onValidate }) {
    const { t } = useTranslation();

    return (
        <div className="input-container">
            <input
                type="text"
                data-id={macro.macroId}
                name="shortcut"
                value={macro.shortcut || ""}
                onChange={(e) => onChange(macro, "shortcut", e.target.value)}
                onBlur={(e) => onValidate(macro, e.target.value)}
                placeholder={t('shortcut_placeholder')}
            />
            <textarea
                value={macro.text || ""}
                onChange={(e) => onChange(macro, "text", e.target.value)}
                placeholder={t('macro_placeholder')}
            />
        </div>
    );
}

MacroInput.propTypes = {
    macro: PropTypes.shape({
        macroId: PropTypes.string.isRequired,
        shortcut: PropTypes.string,
        text: PropTypes.string,
    }).isRequired,
    onChange: PropTypes.func.isRequired,
    onValidate: PropTypes.func.isRequired,
};  