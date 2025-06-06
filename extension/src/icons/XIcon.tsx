export default function XIcon(props: { className?: string }) {
    const { className } = props;
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={
                className ??
                `h-6 w-6 fill-current text-gray-400 dark:text-white`
            }
            viewBox="0 0 24 24"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.414 12L19 17.586A1 1 0 0117.586 19L12 13.414 6.414 19A1 1 0 015 17.586L10.586 12 5 6.414A1 1 0 116.414 5L12 10.586 17.586 5A1 1 0 1119 6.414L13.414 12z"
            ></path>
        </svg>
    );
}
