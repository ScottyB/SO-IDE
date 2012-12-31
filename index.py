#!/usr/bin/env python
#
# Web app that allows you to code by using snippets found on Stack Overflow
# just for fun, not intended for live code use at your own risk :)
#
# author: ScottB

import os.path as op
import urllib
from BeautifulSoup import BeautifulSoup as BS
from tornado import web, ioloop
import zipfile

class MainHandler(web.RequestHandler):

    def get(self):
        self.render("static/index.html")


class SOWrapper(web.RequestHandler):

    def post(self):
        url = self.get_argument("url")
        url_contents = urllib.urlopen(url)

        soup = BS(url_contents.read())
        for script in soup.findAll('script'):
            script.extract()

        result = soup.toEncoding(soup)
        self.write(result)

class GenerateDownload(web.RequestHandler):

    def post(self):
        file_contents = self.get_argument("code")
        print file_contents
        srcFile = op.join("static", "main.java")

        with open(srcFile, "w") as f:
            f.write(file_contents)

        with zipfile.ZipFile(op.join('static', 'files.zip'), 'w') as zf:
            zf.write(srcFile)

        self.write({"download" : "static/files.zip"})

if __name__ == "__main__":

    SETTINGS = {
        "static_path": op.join(op.dirname(__file__), "static"),
        "debug": True}

    web.Application([(r"/", MainHandler),
                     (r"/fetch", SOWrapper),
                     (r"/download", GenerateDownload)],**SETTINGS).listen(8888)


    ioloop.IOLoop.instance().start()
