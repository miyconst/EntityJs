using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using EntityJs.Client.Objects;
using System.Data.Entity;

namespace EntityJs.Client.Events
{
    public class CheckPermissionsEventArgs : EntityEventArgs
    {
        public CheckPermissionsEventArgs(DbContext Context, string EntitySetName, string EntityName, IEntity Entity, ActionsEnum Action)
            : this(Context, EntitySetName, EntityName, Entity, new Dictionary<string, object>(), Action)
        {
        }

        public CheckPermissionsEventArgs(DbContext Context, string EntitySetName, string EntityName, IEntity Entity, Dictionary<string, object> Values, ActionsEnum Action)
            : base(Context, EntitySetName, EntityName, Entity, Values, Action)
        {
            Cancel = true;
            Errors = new List<string>();
        }

        public OperationResultsEnum Result
        { get; set; }

        public bool Cancel
        {
            get
            {
                return Result > OperationResultsEnum.Passed;
            }
            set
            {
                if (value)
                {
                    Result = Result == OperationResultsEnum.OperationCanceled ? Result : OperationResultsEnum.EntityCanceled;
                }
                else
                {
                    Result = OperationResultsEnum.Passed;
                }
            }
        }

        public List<String> Errors { get; protected set; }
    }
}
