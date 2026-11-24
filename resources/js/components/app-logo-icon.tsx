
import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>
) {
    return (
        <img
            {...props}
            src="/logo/tfvc.jpg"
            alt="TFVC Logo"
        />
    );
}
