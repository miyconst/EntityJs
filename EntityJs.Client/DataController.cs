using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Data.Objects;
using EntityJs.Client;
using EntityJs.Client.Objects;

namespace EntityJs.Client
{
    public abstract class DataControllerBase : Controller
    {
        protected ObjectContext db;
        protected EntityModel<ObjectContext> model;

        public DataControllerBase(ObjectContext DB)
        {
            this.db = DB;
            model = CreateModel();
        }

        public virtual JsonResult Update(JsChanges Changes)
        {
            JsonResult result = new JsonResult();
            Updater<ObjectContext> updater = new Updater<ObjectContext>(model);
            JsSaveResult data = updater.Update(Changes);

            result.Data = new
            {
                code = 200,
                result = data.ToJson()
            };
            result.JsonRequestBehavior = JsonRequestBehavior.AllowGet;

            return result;
        }

        public virtual JsonResult Select(JsSelectOptions Options)//string EntitySetName, string EntityName, Objects.JsIncludeParameter[] Includes = null, Objects.JsWhereParameter[] Wheres = null, Objects.JsOrderParameter[] Orders = null, int Skip = -1, int Take = -1, string WhereMethod = null, string OrderMethod = null)
        {
            JsonResult result = new JsonResult();
            Selecter<ObjectContext> selecter = new Selecter<ObjectContext>(model);
            JsSelectResult data = selecter.Select(Options);//EntitySetName, EntityName, Includes, Wheres, Orders, Skip, Take, WhereMethod, OrderMethod);
            List<string> log = data.Data as List<string>;
            result.Data = new
            {
                code = 200,
                result = data.ToJson()
            };
            result.JsonRequestBehavior = JsonRequestBehavior.AllowGet;
            if (log != null)
            {
                log.Add(string.Format("{0:hh:mm.ss:ffff} Select data serialized", DateTime.Now));
            }
            return result;
        }

        public virtual JsonResult SaveUserSettings(string Name, string Value)
        {
            throw new NotImplementedException();
        }

        public virtual ActionResult UploadFile(string ID, int FileID = -1)
        {
            throw new NotImplementedException();
        }

        public virtual ActionResult DownloadFile(string ID, int FileID = -1)
        {
            throw new NotImplementedException();
        }

        public virtual void ImageThumbnail(string ID, int FileID, int Width = 100)
        {
            throw new NotImplementedException();
        }

        public virtual ActionResult Empty(int ID)
        {
            throw new NotImplementedException();
        }

        protected virtual EntityModel<ObjectContext> CreateModel()
        {
            return new EntityModel<ObjectContext>(db);
        }

        protected virtual string GetNextFileName(string FileName, string FolderPath)
        {
            Random rand = new Random();
            int code = Math.Abs(FileName.GetHashCode());
            string ext = System.IO.Path.GetExtension(FileName);
            string name = null;
            System.IO.FileInfo fi;

            for (int i = 0; i < 10; i++)
            {
                name = string.Format("{0}_{1}{2}{3}", DateTime.Now.ToString("yyyyMMddHHmmss"), code, rand.Next(0, 9), ext);
                fi = new System.IO.FileInfo(FolderPath + "/" + name);

                if (!fi.Exists)
                {
                    break;
                }

                System.Threading.Thread.CurrentThread.Join(1000);
            }

            return name;
        }

        protected virtual string GetUploadedFilesDirectoryName()
        {
            return "UploadedFiles";
        }

        protected virtual string GetUploadedFilesPath()
        {
            string result = string.Format("{0}/{1}", HttpRuntime.AppDomainAppPath, this.GetUploadedFilesDirectoryName());
            System.IO.DirectoryInfo di = new System.IO.DirectoryInfo(result);

            if (!di.Exists)
            {
                di.Create();
            }

            return result;
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            model.Dispose();
        }
    }
}
