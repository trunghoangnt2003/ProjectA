interface AppLoaderProps {
  label?: string;
}

/**
 * Loader thương hiệu: vòng gradient xoay mượt + đốm tâm nảy nhẹ.
 * Dùng cho mọi trạng thái tải (LoadingOverlay, tải trang...).
 */
export function AppLoader({ label = "Đang tải..." }: AppLoaderProps) {
  return (
    <div className="app-loader">
      <div className="app-loader__ring">
        <div className="app-loader__dot" />
      </div>
      {label && <div className="app-loader__label">{label}</div>}
    </div>
  );
}
