import { NavLink } from "react-router-dom";
import electronService from "@/services/electronService";

import "./index.css";

// 顶部导航组件
function TopHeader() {

  return (
      <div className="top-header">
        <div className="top-nav">
          <NavLink to="/download" className="top-nav-item logo" activeClassName="active">
            剪映小助手(免费客户端)
          </NavLink>
          <div className="top-nav-group">
            <NavLink
              to="/download"
              className="top-nav-item"
              activeClassName="active"
              onClick={() =>
                electronService.openExternalUrl("https://jcaigc.cn")
              }
            >
              前往官网
            </NavLink>
            <NavLink
              to="/history"
              className="top-nav-item"
              activeClassName="active"
            >
              草稿历史
            </NavLink>
            <NavLink
              to="/config"
              className="top-nav-item"
              activeClassName="active"
            >
              配置中心
            </NavLink>
          </div>
        </div>
      </div>
  );
}
export default TopHeader;