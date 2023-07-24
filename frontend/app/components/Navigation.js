import logo from "../assets/logoo.svg";
import Image from "next/image";
import Link from "next/link";

const Navigation = ({ account, setAccount }) => {
  const connectHandler = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAccount(accounts[0]);
  };
  return (
    <nav>
      <ul className="nav__links">
        <li>
          <Link href="/buy">Buy</Link>
        </li>
        <li>
          <Link href="/rent">Rent</Link>
        </li>
        <li>
          <Link href="/sell">Sell</Link>
        </li>
      </ul>
      <div className="nav__brand">
        <Image src={logo} alt="Logo" />
        <h1>Real Estate</h1>
      </div>

      {account ? (
        <button type="button" className="nav__connect">
          {account.slice(0, 6) + "..." + account.slice(38, 42)}
        </button>
      ) : (
        <button type="button" className="nav__connect" onClick={connectHandler}>
          Connect
        </button>
      )}
    </nav>
  );
};

export default Navigation;
