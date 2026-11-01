"""Estoque Fácil: aplicação acadêmica local, sem dependências externas."""
import argparse
import threading
import webbrowser
from pathlib import Path
from estoque.controllers import make_server
from estoque.models import Database


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--db', type=Path)
    parser.add_argument('--demo', action='store_true', help='Usa base separada com dados fictícios')
    parser.add_argument('--open-browser', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    database = Database(args.db or root / 'data' / ('demo.sqlite' if args.demo else 'estoque.sqlite'))
    database.initialize()
    if args.demo:
        database.seed_demo()
    try:
        server = make_server(database, root / 'static', port=args.port, demo=args.demo)
    except OSError as exc:
        parser.exit(1, f'Não foi possível abrir a porta {args.port}: {exc}\nUse --port 8766.\n')
    url = f'http://127.0.0.1:{server.server_port}'
    print(f'Estoque Fácil disponível em {url}\nPressione Ctrl+C para encerrar.', flush=True)
    if args.open_browser:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nAplicação encerrada.')
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
